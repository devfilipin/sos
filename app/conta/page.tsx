import{requireUser}from"@/lib/auth";import ContaClient from"./conta-client";export default async function ContaPage(){await requireUser("/conta");return <ContaClient/>}
