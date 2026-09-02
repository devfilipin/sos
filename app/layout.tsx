import type {Metadata} from "next";import "./globals.css";import "./app.css";import "./brand-light.css";import "./auth.css";import "./security.css";import "./emergency.css";import "./legal.css";import "./controls.css";
export const metadata:Metadata={title:"Resolveu SOS | Seu cuidado sempre por perto",description:"Informações essenciais de emergência, acessíveis em segundos e sob seu controle."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
