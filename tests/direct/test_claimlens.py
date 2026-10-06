"""Direct fixtures with captured validator replay. These are not live consensus proof."""
import json
import hashlib
from pathlib import Path
import pytest
from gltest.direct import VMContext, deploy_contract, create_address

CONTRACT=Path(__file__).resolve().parents[2]/'contracts'/'claimlens.py'
URL='https://www.nasa.gov/moon/'
TEXT='The Moon reflects sunlight and does not produce its own visible light. '+('This primary source explains the Moon and sunlight. '*5)
QUOTE='The Moon reflects sunlight and does not produce its own visible light.'

def answer(verdict='Contradicted'):
    return {'verdict':verdict,'explanation':'The source explains that moonlight is reflected sunlight.','caveats':'This fixture uses one source.','evidence':[{'url':URL,'title':'Moon facts','quote':QUOTE,'relation':'contradicts'}]}

def mocks(vm,verdict='Contradicted',body=TEXT,status=200):
    vm.mock_web('nasa.gov',{'status':status,'body':body})
    vm.mock_llm('^Adjudicate ONE',json.dumps(answer(verdict)))
    vm.mock_llm('^Verify the proposed',json.dumps({'valid':True}))

@pytest.fixture(scope="module")
def base_case():
    vm=VMContext()
    with vm.activate():
        contract=deploy_contract(CONTRACT,vm)
        owner=create_address('claimlens-fixture-owner')
        vm.sender=owner
        payload=json.dumps({'schema':1,'policy':'claimlens-evidence-v1','id':'a'*8+'-'+ 'b'*4+'-'+ 'c'*4+'-'+ 'd'*4+'-'+ 'e'*12,'owner':str(owner).lower(),'claim':'The Moon produces its own visible light.','source':URL,'source_urls':[URL],'as_of':'2026-10-06'},separators=(',',':'))
        yield vm,contract,payload

@pytest.fixture
def case(base_case):
    vm,contract,payload=base_case
    snapshot=vm.snapshot()
    yield vm,contract,payload
    vm.revert(snapshot)

def test_grounded_result_provenance_replay_and_duplicate_guard(case):
    vm,contract,payload=case
    mocks(vm)
    contract.check_claim(payload)
    request=json.loads(payload)
    result=json.loads(contract.get_check(request['owner'],request['id']))
    assert result['input_hash']==hashlib.sha256(payload.encode()).hexdigest()
    assert result['verdict']=='Contradicted'
    assert vm.run_validator() is True
    with pytest.raises(Exception,match='CHECK_ALREADY_EXISTS'):
        contract.check_claim(payload)

def test_changed_source_and_disagreement_reject_leader(case):
    vm,contract,payload=case
    mocks(vm);contract.check_claim(payload)
    vm.clear_mocks();mocks(vm,body='A different page about telescope manufacture. '*10)
    assert vm.run_validator() is False
    vm.clear_mocks();mocks(vm,verdict='Supported')
    assert vm.run_validator() is False

def test_unavailable_sources_never_store_a_verdict(case):
    vm,contract,payload=case
    mocks(vm,status=403)
    with pytest.raises(Exception,match='SOURCE_ACCESS_FAILED'):
        contract.check_claim(payload)
    request=json.loads(payload)
    assert contract.get_check(request['owner'],request['id'])==''

def test_invented_quote_and_malformed_model_response_fail(case):
    vm,contract,payload=case
    vm.mock_web('nasa.gov',{'status':200,'body':TEXT})
    bad=answer();bad['evidence'][0]['quote']='This quote is fabricated and absent from the source.'
    vm.mock_llm('^Adjudicate ONE',json.dumps(bad))
    with pytest.raises(Exception,match='UNGROUNDED_QUOTE'):
        contract.check_claim(payload)
    vm.clear_mocks();vm.mock_web('nasa.gov',{'status':200,'body':TEXT});vm.mock_llm('^Adjudicate ONE','{}')
    with pytest.raises(Exception,match='MODEL_OUTPUT_INVALID'):
        contract.check_claim(payload)

def test_insufficient_evidence_can_be_an_honest_result(case):
    vm,contract,payload=case
    vm.mock_web('nasa.gov',{'status':200,'body':TEXT})
    value={'verdict':'Insufficient evidence','explanation':'The accessible source is unrelated to the requested assertion.','caveats':'No relevant primary evidence.','evidence':[]}
    vm.mock_llm('^Adjudicate ONE',json.dumps(value));vm.mock_llm('^Verify the proposed',json.dumps({'valid':True}))
    contract.check_claim(payload)
    assert vm.run_validator() is True

def test_large_page_assets_do_not_displace_article_evidence(case):
    vm,contract,payload=case
    body='<html><head><style>'+('.asset{color:red}'*16000)+'</style></head><body><nav>Navigation only</nav><main><article><p>'+TEXT.replace('sunlight','sunlight &amp; reflected light')+'</p></article></main></body></html>'
    value=answer();value['evidence'][0]['quote']=QUOTE.replace('sunlight','sunlight & reflected light')
    vm.mock_web('nasa.gov',{'status':200,'body':body})
    vm.mock_llm('^Adjudicate ONE',json.dumps(value));vm.mock_llm('^Verify the proposed',json.dumps({'valid':True}))
    contract.check_claim(payload)
    assert vm.run_validator() is True

def test_title_and_incomplete_styles_cannot_be_evidence(case):
    vm,contract,payload=case
    body='<html><head><title>'+QUOTE+'</title><style>'+('.asset{color:red}'*5000)+'</style></head><body><main>'+('A page about telescope manufacture. '*10)+'</main></body></html>'
    mocks(vm,body=body)
    with pytest.raises(Exception,match='UNGROUNDED_QUOTE'):
        contract.check_claim(payload)
    vm.clear_mocks()
    mocks(vm,body='<style>'+('This is not article evidence. '*40000))
    with pytest.raises(Exception,match='SOURCE_ACCESS_FAILED'):
        contract.check_claim(payload)

