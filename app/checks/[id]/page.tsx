import CheckDetail from '@/components/check-detail';
export const dynamic='force-dynamic';
export const metadata={title:'Fact check · ClaimLens',description:'A saved claim and its evidence. Private checks require wallet sign-in.',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{id:string}>}){return <CheckDetail id={(await params).id}/>;}
