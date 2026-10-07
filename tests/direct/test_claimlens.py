"""Direct fixtures with captured validator replay. These are not live consensus proof."""
import json
import hashlib
import ast
import re
from html import unescape
from pathlib import Path
import pytest
from gltest.direct import VMContext, deploy_contract, create_address

CONTRACT=Path(__file__).resolve().parents[2]/'contracts'/'claimlens.py'
URL='https://www.nasa.gov/moon/'
TEXT='The Moon reflects sunlight and does not produce its own visible light. '+('This primary source explains the Moon and sunlight. '*5)
QUOTE='The Moon reflects sunlight and does not produce its own visible light.'

def answer(verdict='Contradicted'):
    return {'verdict':verdict,'explanation':'The source explains that moonlight is reflected sunlight.','caveats':'This fixture uses one source.','evidence':[{'url':URL,'title':'Moon facts','passage_id':'p0','relation':'contradicts'}]}

def mock_answer(vm, value):
    vm.mock_llm('^Adjudicate ONE',json.dumps(value))
    vm.mock_llm('^Repair the invalid',json.dumps(value))

def mocks(vm,verdict='Contradicted',body=TEXT,status=200):
    vm.mock_web('nasa.gov',{'status':status,'body':body})
    mock_answer(vm,answer(verdict))
    vm.mock_llm('^Verify the proposed',json.dumps({'valid':True,'independent_verdict':verdict,'reason':'The source supports this conclusion and its explanation.'}))

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
    assert result['evidence'][0]['quote']==QUOTE
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
    assert vm.run_validator() is True


def test_processing_error_requires_independent_reproduction(case):
    vm,contract,payload=case
    mocks(vm,status=403)
    with pytest.raises(Exception,match='SOURCE_ACCESS_FAILED'):
        contract.check_claim(payload)
    vm.clear_mocks();mocks(vm)
    assert vm.run_validator() is False
    request=json.loads(payload)
    assert contract.get_check(request['owner'],request['id'])==''


def test_one_unavailable_candidate_does_not_hide_accessible_evidence(case):
    vm,contract,payload=case
    request=json.loads(payload)
    request['source_urls']=['https://unavailable.gov/record',URL]
    vm.mock_web('unavailable.gov',{'status':503,'body':'unavailable'})
    mocks(vm)
    contract.check_claim(json.dumps(request,separators=(',',':')))
    result=json.loads(contract.get_check(request['owner'],request['id']))
    assert [entry['url'] for entry in result['evidence']]==[URL]
    assert vm.run_validator() is True


def test_consensus_compares_substance_without_requiring_identical_wording(case):
    vm,contract,payload=case
    mocks(vm);contract.check_claim(payload)
    vm.clear_mocks();mocks(vm)
    independent=answer()
    independent['explanation']='Visible moonlight comes from sunlight reflected by the lunar surface.'
    independent['caveats']='The evidence concerns visible light.'
    mock_answer(vm,independent)
    assert vm.run_validator() is True

def test_invented_quote_and_malformed_model_response_fail(case):
    vm,contract,payload=case
    vm.mock_web('nasa.gov',{'status':200,'body':TEXT})
    bad=answer();bad['evidence'][0]['passage_id']='invented-passage'
    mock_answer(vm,bad)
    with pytest.raises(Exception,match='UNGROUNDED_QUOTE'):
        contract.check_claim(payload)
    assert vm.run_validator() is True
    vm.clear_mocks();vm.mock_web('nasa.gov',{'status':200,'body':TEXT});mock_answer(vm,{})
    with pytest.raises(Exception,match='MODEL_OUTPUT_INVALID'):
        contract.check_claim(payload)

def test_insufficient_evidence_can_be_an_honest_result(case):
    vm,contract,payload=case
    vm.mock_web('nasa.gov',{'status':200,'body':TEXT})
    value={'verdict':'Insufficient evidence','explanation':'The accessible source is unrelated to the requested assertion.','caveats':'No relevant primary evidence.','evidence':[]}
    vm.mock_llm('^Adjudicate ONE',json.dumps(value));vm.mock_llm('^Verify the proposed',json.dumps({'valid':True,'independent_verdict':value['verdict'],'reason':'The source supports this conclusion and its explanation.'}))
    contract.check_claim(payload)
    assert vm.run_validator() is True

def test_large_page_assets_do_not_displace_article_evidence(case):
    vm,contract,payload=case
    body='<html><head><style>'+('.asset{color:red}'*16000)+'</style></head><body><nav>Navigation only</nav><main><article><p>'+TEXT.replace('sunlight','sunlight &amp; reflected light')+'</p></article></main></body></html>'
    value=answer()
    vm.mock_web('nasa.gov',{'status':200,'body':body})
    vm.mock_llm('^Adjudicate ONE',json.dumps(value));vm.mock_llm('^Verify the proposed',json.dumps({'valid':True,'independent_verdict':value['verdict'],'reason':'The source supports this conclusion and its explanation.'}))
    contract.check_claim(payload)
    request=json.loads(payload)
    result=json.loads(contract.get_check(request['owner'],request['id']))
    assert result['evidence'][0]['quote']==QUOTE.replace('sunlight','sunlight & reflected light')
    assert vm.run_validator() is True

def test_title_and_incomplete_styles_cannot_be_evidence(case):
    vm,contract,payload=case
    body='<html><head><title>'+QUOTE+'</title><style>'+('.asset{color:red}'*5000)+'</style></head><body><main>'+('A page about telescope manufacture. '*10)+'</main></body></html>'
    vm.mock_web('nasa.gov',{'status':200,'body':body})
    bad=answer();bad['evidence'][0]['passage_id']='head-title'
    mock_answer(vm,bad)
    with pytest.raises(Exception,match='UNGROUNDED_QUOTE'):
        contract.check_claim(payload)
    vm.clear_mocks()
    mocks(vm,body='<style>'+('This is not article evidence. '*40000))
    with pytest.raises(Exception,match='SOURCE_ACCESS_FAILED'):
        contract.check_claim(payload)

def test_invalid_reference_is_repaired_without_changing_source_text(case):
    vm,contract,payload=case
    vm.mock_web('nasa.gov',{'status':200,'body':TEXT})
    bad=answer();bad['evidence'][0]['passage_id']='missing'
    vm.mock_llm('^Adjudicate ONE',json.dumps(bad))
    vm.mock_llm('^Repair the invalid',json.dumps(answer()))
    vm.mock_llm('^Verify the proposed',json.dumps({'valid':True,'independent_verdict':'Contradicted','reason':'The source supports this conclusion and its explanation.'}))
    contract.check_claim(payload)
    request=json.loads(payload)
    result=json.loads(contract.get_check(request['owner'],request['id']))
    assert result['evidence'][0]['quote']==QUOTE
    assert vm.run_validator() is True

def test_model_cannot_replace_a_selected_quote_with_fabricated_text(case):
    vm,contract,payload=case
    vm.mock_web('nasa.gov',{'status':200,'body':TEXT})
    value=answer();value['evidence'][0]['quote']='An invented statistic that is absent from this source.'
    mock_answer(vm,value);vm.mock_llm('^Verify the proposed',json.dumps({'valid':True,'independent_verdict':'Contradicted','reason':'The source supports this conclusion and its explanation.'}))
    contract.check_claim(payload)
    request=json.loads(payload)
    assert json.loads(contract.get_check(request['owner'],request['id']))['evidence'][0]['quote']==QUOTE

def test_passages_are_bounded_exact_unicode_substrings():
    tree=ast.parse(CONTRACT.read_text(encoding='utf-8'))
    nodes=[item for item in tree.body if isinstance(item,ast.FunctionDef) and item.name in ['clean','source_text','passages']]
    namespace={'re':re,'unescape':unescape,'MAX_PAGE_TEXT':6000}
    exec(compile(ast.Module(body=nodes,type_ignores=[]),str(CONTRACT),'exec'),namespace)
    text=('Neymar’s career totals require a defined competition and date. '+('A long substantive sentence with statistical context '*20)+'. '+('x'*175)+'.')
    parts=namespace['passages'](text)
    assert len(parts)>4
    assert all(10<=len(part['text'])<=160 and part['text'] in text for part in parts)
    assert len({part['id'] for part in parts})==len(parts)
    body='<head><title>'+QUOTE+'</title></head><body><main>'+('Unrelated telescope evidence. '*10)+'</main></body>'
    cleaned,_=namespace['source_text'](body.encode())
    assert QUOTE not in cleaned and 'telescope' in cleaned

@pytest.mark.parametrize('label',['Supported','Contradicted','Misleading','Not a factual claim'])
def test_label_roundtrip_with_resolved_citations(case,label):
    vm,contract,payload=case
    mocks(vm,verdict=label)
    contract.check_claim(payload)
    request=json.loads(payload)
    assert json.loads(contract.get_check(request['owner'],request['id']))['verdict']==label
    assert vm.run_validator() is True

@pytest.mark.parametrize('judgment',[
    {'valid':False,'independent_verdict':'Contradicted','reason':'The explanation invents a fact.'},
    {'valid':True,'independent_verdict':'Supported','reason':'The independent decision differs.'},
    {'valid':True},
    {'valid':'true','independent_verdict':'Contradicted','reason':'Incorrect boolean type.'},
    {'valid':True,'independent_verdict':'Contradicted','reason':''},
])
def test_validator_requires_independent_decision_and_substantive_audit(case,judgment):
    vm,contract,payload=case
    mocks(vm);contract.check_claim(payload)
    vm.clear_mocks();vm.mock_web('nasa.gov',{'status':200,'body':TEXT})
    vm.mock_llm('^Verify the proposed',json.dumps(judgment))
    assert vm.run_validator() is False

def test_evidence_text_budget_marks_truncation(case):
    vm,contract,payload=case
    mocks(vm,body=TEXT*200)
    contract.check_claim(payload)
    assert vm.run_validator() is True
    tree=ast.parse(CONTRACT.read_text(encoding='utf-8'))
    nodes=[item for item in tree.body if isinstance(item,ast.FunctionDef) and item.name in ['clean','source_text']]
    namespace={'re':re,'unescape':unescape,'MAX_PAGE_TEXT':6000}
    exec(compile(ast.Module(body=nodes,type_ignores=[]),str(CONTRACT),'exec'),namespace)
    text,truncated=namespace['source_text']((TEXT*200).encode())
    assert len(text)==6000 and truncated is True

def test_claim_cannot_supply_owner_or_replace_policy(case):
    vm,contract,payload=case
    for changed in [{'owner':str(create_address('attacker')).lower()},{'policy':'attacker-policy'},{'schema':2}]:
        with pytest.raises(Exception,match='INVALID_PROVENANCE'):
            contract.check_claim(json.dumps({**json.loads(payload),**changed}))

