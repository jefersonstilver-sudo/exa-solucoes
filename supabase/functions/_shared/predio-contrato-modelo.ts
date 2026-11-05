// EXA (05/11/2026) — MODELO DO CONTRATO DE COMODATO DOS PRÉDIOS (o mesmo texto dos contratos assinados em 2026,
// ex.: Edifício Viena, jun/2026) e o gerador do PDF. Sem dependência de Deno/Node: recebe a classe jsPDF pronta,
// para rodar igual na função (npm:jspdf) e no teste local.
// Variáveis: nome do condomínio, CNPJ, endereço, nome de quem assina (síndico/síndica), nº de painéis e a data.

export const MODELO_VERSAO = "comodato-2026.06";

export type DadosContrato = {
  condominio: string;          // ex.: "Condomínio Edifício Cancún"
  cnpj: string;                // 00.000.000/0000-00
  endereco: string;            // rua, nº, bairro, cidade, CEP
  signatario: string;          // nome completo de quem assina pelo condomínio
  cargo?: string;              // "Síndico(a)" (padrão), "Síndica", "Síndico", "Síndica profissional"…
  paineis?: number;            // padrão 1
  data?: Date;                 // padrão: hoje
};

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const EXTENSO = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];

export function dataExtenso(d: Date): string {
  // data no horário de Brasília
  const br = new Date(d.getTime() - 3 * 3600_000);
  return `${br.getUTCDate()} de ${MESES[br.getUTCMonth()]} de ${br.getUTCFullYear()}`;
}

export function cnpjValido(c: string): boolean {
  const d = String(c || "").replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = pesos.reduce((a, p, i) => a + p * Number(d[i]), 0) % 11;
    return s < 2 ? 0 : 11 - s;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}
export function formatarCnpj(c: string): string {
  const d = String(c || "").replace(/\D/g, "");
  return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : String(c || "").trim();
}

// Bloco do contrato: t = titulo | c = cláusula | p = parágrafo | l = item de lista | q = qualificação (rótulo em negrito)
export type Bloco = { t: "titulo" | "c" | "p" | "l" | "q" | "local" | "assinaturas"; txt?: string; rotulo?: string };

export function blocosContrato(d: DadosContrato): Bloco[] {
  const n = Math.max(1, Math.min(10, Math.round(d.paineis || 1)));
  const qtd = `${String(n).padStart(2, "0")} (${EXTENSO[n]})`;
  const um = n === 1;
  const cond = d.condominio.trim().toUpperCase();
  const cargo = (d.cargo || "Síndico(a)").trim();
  const c = cargo.toLowerCase();
  const fem = /s[ií]ndica(?!\(|o)/.test(c) && !/\(a\)/.test(c), masc = /s[ií]ndico\b/.test(c) && !/\(a\)/.test(c);
  const repr = fem ? `sua ${c} legalmente eleita` : masc ? `seu ${c} legalmente eleito` : `seu(sua) ${c} legalmente eleito(a)`;
  return [
    { t: "titulo", txt: "CONTRATO DE COMODATO DE PAINEL DIGITAL EXA" },
    { t: "c", txt: "CLÁUSULA PRIMEIRA – DAS PARTES" },
    { t: "q", rotulo: "COMODANTE:", txt: "INDEXA MÍDIA LTDA, pessoa jurídica de direito privado, inscrita no CNPJ nº 38.142.638/0001-30, com sede na Avenida Paraná, nº 974, Sala 301, 3º andar, Centro, CEP 85852-000, Foz do Iguaçu/PR, mantenedora do projeto www.examidia.com.br e operadora da marca EXA MÍDIA, neste ato representada por seu sócio administrador JEFERSON STILVER RODRIGUES ENCINA, doravante denominada EXA." },
    { t: "q", rotulo: "COMODATÁRIO:", txt: `${cond}, inscrito no CNPJ nº ${formatarCnpj(d.cnpj)}, localizado na ${d.endereco.trim()}, neste ato representado por ${repr}, ${d.signatario.trim().toUpperCase()}, doravante denominado CONDOMÍNIO.` },
    { t: "c", txt: "CLÁUSULA SEGUNDA – DO OBJETO" },
    { t: "p", txt: `2.1. O presente contrato tem por objeto a cessão gratuita, em regime de comodato, de ${qtd} ${um ? "painel digital EXA" : "painéis digitais EXA"} para exibição de conteúdos institucionais, informativos e publicitários, a ser${um ? "" : "em"} ${um ? "instalado" : "instalados"} no interior do${um ? "" : "s"} elevador${um ? "" : "es"} do CONDOMÍNIO.` },
    { t: "p", txt: "2.2. O equipamento será utilizado exclusivamente para a exibição de conteúdos aprovados e gerenciados pela EXA, de acordo com as normas legais vigentes e o Código de Autorregulamentação Publicitária do CONAR." },
    { t: "p", txt: "2.3. O conteúdo exibido visa aprimorar a comunicação condominial e oferecer espaço publicitário a parceiros e anunciantes da EXA, cabendo à EXA o controle integral sobre a programação e a monetização do painel." },
    { t: "p", txt: "2.4. Integra ainda o objeto deste contrato a disponibilização gratuita de rede Wi-Fi ao CONDOMÍNIO, conforme regras e condições estabelecidas na Cláusula Sexta." },
    { t: "c", txt: "CLÁUSULA TERCEIRA – DAS OBRIGAÇÕES DA EXA" },
    { t: "p", txt: "3.1. A EXA compromete-se a:" },
    { t: "l", txt: "a) Realizar a instalação, manutenção e suporte técnico integral do painel digital, sem qualquer custo ao CONDOMÍNIO;" },
    { t: "l", txt: "b) Fornecer conectividade dedicada (internet) necessária ao funcionamento do painel e da rede Wi-Fi disponibilizada ao CONDOMÍNIO;" },
    { t: "l", txt: "c) Garantir a segurança elétrica e estrutural da instalação, respeitando as normas da empresa responsável pela manutenção dos elevadores;" },
    { t: "l", txt: "d) Substituir o equipamento em caso de falha técnica não causada por terceiros;" },
    { t: "l", txt: "e) Manter controle total sobre o conteúdo publicitário e institucional exibido no painel;" },
    { t: "l", txt: "f) Disponibilizar acesso ao Portal do Síndico EXA e às futuras plataformas integradas;" },
    { t: "l", txt: "g) Responder por quaisquer danos comprovadamente causados por falha técnica exclusiva do equipamento;" },
    { t: "l", txt: "h) Realizar, sem qualquer custo ao CONDOMÍNIO, a eventual atualização e/ou substituição do equipamento por modelos mais modernos, sempre que a EXA entender tecnicamente adequado, incluindo a retirada do equipamento antigo e a instalação do novo." },
    { t: "c", txt: "CLÁUSULA QUARTA – DAS OBRIGAÇÕES DO CONDOMÍNIO" },
    { t: "p", txt: "4.1. O CONDOMÍNIO obriga-se a:" },
    { t: "l", txt: "a) Autorizar o acesso da equipe técnica da EXA e da empresa de elevadores para instalação, manutenção e atualização do equipamento;" },
    { t: "l", txt: "b) Garantir acesso livre ao elevador e áreas técnicas durante os serviços de instalação, manutenção ou suporte;" },
    { t: "l", txt: "c) Comunicar imediatamente à EXA quaisquer irregularidades, falhas ou danos identificados no painel;" },
    { t: "l", txt: "d) Preservar o equipamento e adotar medidas razoáveis para evitar vandalismo;" },
    { t: "l", txt: "e) Utilizar o módulo interno \"Notícias do Condomínio\" exclusivamente para avisos internos e de interesse dos condôminos, sob responsabilidade total do(a) síndico(a);" },
    { t: "l", txt: "f) Cumprir integralmente a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD);" },
    { t: "l", txt: "g) Abster-se de modificar, transferir, remover ou interferir no painel, em seus componentes, software ou infraestrutura de conectividade, sem autorização expressa da EXA." },
    { t: "c", txt: "CLÁUSULA QUINTA – DO MÓDULO \"NOTÍCIAS DO CONDOMÍNIO\"" },
    { t: "p", txt: "5.1. O(a) síndico(a) é responsável pela publicação de avisos internos no módulo \"Notícias do Condomínio\", que poderá ser operado diretamente pelo(a) síndico(a) ou mediante solicitação à equipe da EXA através do canal de comunicação por WhatsApp, conforme fluxo operacional previamente apresentado e disponibilizado pela EXA." },
    { t: "p", txt: "5.2. O CONDOMÍNIO, representado pelo(a) síndico(a), é o único responsável pelo conteúdo, veracidade e adequação dos avisos publicados no módulo, respondendo civil e legalmente por eventuais danos causados a terceiros em razão da publicação." },
    { t: "p", txt: "5.3. A EXA reserva-se o direito de suspender ou recusar a publicação de conteúdo que viole a legislação vigente, as normas do CONAR, princípios éticos ou que possa causar prejuízo à imagem da EXA, do CONDOMÍNIO ou de terceiros." },
    { t: "c", txt: "CLÁUSULA SEXTA – DA DISPONIBILIZAÇÃO DE WI-FI GRATUITO" },
    { t: "p", txt: "6.1. A EXA disponibilizará ao CONDOMÍNIO, de forma totalmente gratuita, rede Wi-Fi acessível por meio de QR Code afixado no painel digital instalado no elevador, assumindo integralmente os custos de conectividade (serviço de internet, infraestrutura e manutenção da rede)." },
    { t: "p", txt: "6.2. O Wi-Fi disponibilizado possui alcance limitado à proximidade do painel digital, restringindo-se ao interior do elevador e ao seu entorno imediato, não havendo compromisso da EXA quanto à cobertura do sinal em outras áreas do CONDOMÍNIO." },
    { t: "p", txt: "6.3. A ativação da rede Wi-Fi está condicionada à autorização conjunta do(a) síndico(a) do CONDOMÍNIO e da EXA, formalizada no momento da instalação ou em momento posterior, conforme conveniência das partes." },
    { t: "p", txt: "6.4. O uso do Wi-Fi é destinado aos condôminos, moradores e visitantes autorizados, para finalidades lícitas e em conformidade com os termos de uso disponibilizados no momento da conexão." },
    { t: "p", txt: "6.5. Da responsabilidade pelo uso do Wi-Fi:" },
    { t: "p", txt: "6.5.1. A EXA observará integralmente o Marco Civil da Internet (Lei nº 12.965/2014) e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD), mantendo os registros de conexão exigidos pela legislação." },
    { t: "p", txt: "6.5.2. Os usuários do Wi-Fi serão previamente informados e deverão aceitar termo de uso que contenha, minimamente: (i) finalidade do serviço; (ii) registro de dados de conexão conforme Marco Civil; (iii) vedação a usos ilícitos; (iv) isenção de responsabilidade da EXA e do CONDOMÍNIO por uso indevido pelo usuário." },
    { t: "p", txt: "6.5.3. A EXA e o CONDOMÍNIO não se responsabilizam por qualquer uso indevido, ilícito ou inadequado da rede Wi-Fi por parte dos usuários, sendo o próprio usuário responsável pelas atividades realizadas durante a sua conexão, nos termos da legislação vigente." },
    { t: "p", txt: "6.5.4. A EXA poderá, a qualquer tempo, suspender temporariamente ou encerrar o serviço de Wi-Fi em caso de indícios de uso indevido, violação legal ou necessidade técnica, comunicando o CONDOMÍNIO quando possível." },
    { t: "c", txt: "CLÁUSULA SÉTIMA – DA PROPRIEDADE E DO COMODATO" },
    { t: "p", txt: "7.1. O equipamento é de propriedade exclusiva da EXA, cedido em regime de comodato ao CONDOMÍNIO." },
    { t: "p", txt: "7.2. O CONDOMÍNIO recebe o painel em comodato, obrigando-se a devolvê-lo em perfeito estado de funcionamento e conservação caso o contrato seja encerrado, ressalvado o desgaste natural decorrente do uso adequado." },
    { t: "p", txt: "7.3. É vedado o uso do equipamento para finalidades não previstas neste contrato." },
    { t: "p", txt: "7.4. Eventuais atualizações ou substituições do equipamento por versões mais modernas serão realizadas pela EXA sem ônus ao CONDOMÍNIO, conforme previsto no item 3.1.h." },
    { t: "c", txt: "CLÁUSULA OITAVA – DA VIGÊNCIA E RESCISÃO" },
    { t: "p", txt: "8.1. O presente contrato terá vigência inicial de 24 (vinte e quatro) meses, contados da data de sua assinatura, renovável automaticamente por igual período, salvo manifestação contrária de qualquer das partes." },
    { t: "p", txt: "8.2. O CONDOMÍNIO poderá rescindir o contrato a qualquer momento, mediante notificação formal com antecedência mínima de 30 (trinta) dias." },
    { t: "p", txt: "8.3. A EXA poderá rescindir o contrato nas seguintes situações:" },
    { t: "l", txt: "a) Risco à integridade do equipamento;" },
    { t: "l", txt: "b) Alteração estrutural no elevador que impeça a instalação ou o funcionamento adequado do painel;" },
    { t: "l", txt: "c) Ausência de acesso técnico por mais de 15 (quinze) dias;" },
    { t: "l", txt: "d) Comportamento incompatível com a política de parceria da EXA;" },
    { t: "l", txt: "e) Ocorrência de vandalismo ou danos intencionais ao equipamento quando o CONDOMÍNIO, notificado formalmente, deixar de colaborar com a EXA na identificação do(s) autor(es) do dano e na apuração da responsabilidade." },
    { t: "p", txt: "8.4. Após a notificação de rescisão, a EXA terá o prazo de até 90 (noventa) dias para retirada do equipamento, mediante agendamento prévio com o CONDOMÍNIO." },
    { t: "c", txt: "CLÁUSULA NONA – DA PROPRIEDADE INTELECTUAL E CONFIDENCIALIDADE" },
    { t: "p", txt: "9.1. Todos os direitos sobre softwares, sistemas, conteúdos, identidade visual, marcas, plataformas e tecnologias utilizados ou exibidos no painel pertencem exclusivamente à EXA, sendo vedada qualquer forma de reprodução, cópia, adaptação ou uso sem autorização expressa." },
    { t: "p", txt: "9.2. O CONDOMÍNIO compromete-se a manter sigilo sobre informações técnicas e comerciais relacionadas ao projeto da EXA a que tiver acesso em razão do presente contrato, obrigação que subsiste ao encerramento contratual." },
    { t: "c", txt: "CLÁUSULA DÉCIMA – DA PROTEÇÃO DE DADOS (LGPD)" },
    { t: "p", txt: "10.1. O uso do Portal do Síndico, das plataformas EXA e da rede Wi-Fi respeitará integralmente a Lei nº 13.709/2018 (LGPD) e o Marco Civil da Internet (Lei nº 12.965/2014)." },
    { t: "p", txt: "10.2. Os dados coletados são de uso restrito e destinam-se exclusivamente à personalização da experiência do usuário, cumprimento de obrigações legais e finalidades operacionais do sistema, sem compartilhamento com terceiros não autorizados." },
    { t: "p", txt: "10.3. O CONDOMÍNIO compromete-se a observar a LGPD no tratamento de dados a que tiver acesso em razão do uso das plataformas da EXA." },
    { t: "c", txt: "CLÁUSULA DÉCIMA PRIMEIRA – DA REPRESENTAÇÃO DO SÍNDICO" },
    { t: "p", txt: "11.1. O(a) síndico(a) signatário(a) deste contrato declara expressamente que:" },
    { t: "l", txt: "a) Encontra-se regularmente eleito(a) e em pleno exercício de suas funções representativas do CONDOMÍNIO;" },
    { t: "l", txt: "b) Possui poderes e autorização suficientes, decorrentes da convenção condominial e/ou de deliberação em assembleia, para celebrar o presente contrato em nome do CONDOMÍNIO;" },
    { t: "l", txt: "c) Tem ciência e concorda integralmente com todas as cláusulas e condições deste instrumento." },
    { t: "p", txt: "11.2. A EXA fica isenta de qualquer responsabilidade decorrente de declaração falsa ou indevida por parte do(a) síndico(a) quanto aos seus poderes de representação, sendo o(a) próprio(a) síndico(a) responsável perante o CONDOMÍNIO e terceiros." },
    { t: "c", txt: "CLÁUSULA DÉCIMA SEGUNDA – DO CASO FORTUITO E FORÇA MAIOR" },
    { t: "p", txt: "12.1. Nenhuma das partes será responsabilizada por falhas, interrupções ou danos decorrentes de eventos imprevisíveis ou inevitáveis, classificados como caso fortuito ou força maior, nos termos do art. 393 do Código Civil Brasileiro." },
    { t: "c", txt: "CLÁUSULA DÉCIMA TERCEIRA – DO FORO" },
    { t: "p", txt: "13.1. Fica eleito o foro da Comarca de Foz do Iguaçu/PR para dirimir quaisquer controvérsias decorrentes do presente contrato, renunciando as partes a qualquer outro, por mais privilegiado que seja." },
    { t: "p", txt: "E, por estarem assim justos e contratados, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma, ou eletronicamente, por meio de plataforma de assinatura digital com validade jurídica, nos termos da Medida Provisória nº 2.200-2/2001." },
    { t: "local", txt: `Foz do Iguaçu/PR, ${dataExtenso(d.data || new Date())}.` },
    { t: "assinaturas" },
  ];
}

// ---------------------------------------------------------------- PDF (A4, texto selecionável)
// jsPDF: a classe (npm:jspdf). cabecalho: PNG 1080x120 da faixa EXA (opcional).
export function gerarPdfContrato(jsPDF: any, d: DadosContrato, cabecalho?: Uint8Array | null): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = 210, H = 297, M = 22, LARG = W - 2 * M, RODAPE = H - 18;
  const VERMELHO: [number, number, number] = [156, 30, 30];
  let y = 0;
  const topo = () => {
    if (cabecalho) {
      try { doc.addImage(cabecalho, "PNG", 0, 0, W, W * 120 / 1080); } catch { /* sem faixa */ }
      y = W * 120 / 1080 + 14;
    } else {
      doc.setFillColor(...VERMELHO); doc.rect(0, 0, W, 16, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text("exa", M, 11);
      y = 30;
    }
    doc.setTextColor(25, 25, 25);
  };
  const novaPagina = () => { doc.addPage(); topo(); };
  const garantir = (alt: number) => { if (y + alt > RODAPE) novaPagina(); };
  const paragrafo = (txt: string, o: { tam?: number; negrito?: boolean; recuo?: number; antes?: number; depois?: number; alinhar?: "left" | "center" | "justify" } = {}) => {
    const tam = o.tam ?? 10.5, recuo = o.recuo ?? 0, alt = tam * 0.3528 * 1.45;
    doc.setFont("helvetica", o.negrito ? "bold" : "normal"); doc.setFontSize(tam);
    y += o.antes ?? 0;
    const linhas: string[] = doc.splitTextToSize(txt, LARG - recuo);
    linhas.forEach((ln, i) => {
      garantir(alt);
      const ultima = i === linhas.length - 1;
      if (o.alinhar === "center") doc.text(ln, W / 2, y, { align: "center" });
      else if ((o.alinhar ?? "justify") === "justify" && !ultima) doc.text(ln, M + recuo, y, { align: "justify", maxWidth: LARG - recuo });
      else doc.text(ln, M + recuo, y);
      y += alt;
    });
    y += o.depois ?? 1.6;
  };

  topo();
  for (const b of blocosContrato(d)) {
    if (b.t === "titulo") {
      paragrafo(b.txt!, { tam: 14, negrito: true, alinhar: "center", depois: 2 });
      doc.setDrawColor(...VERMELHO); doc.setLineWidth(0.5); doc.line(M + 20, y, W - M - 20, y); y += 8;
    } else if (b.t === "c") {
      garantir(16); paragrafo(b.txt!, { tam: 11, negrito: true, antes: 3, depois: 1.8, alinhar: "left" });
    } else if (b.t === "q") {
      // rótulo em negrito + texto na mesma linha de início
      doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
      const wr = doc.getTextWidth(b.rotulo!) + 1.8;
      const alt = 10.5 * 0.3528 * 1.45;
      doc.setFont("helvetica", "normal");
      const primeira: string[] = doc.splitTextToSize(b.txt!, LARG - wr);
      const l1 = primeira[0];
      garantir(alt);
      doc.setFont("helvetica", "bold"); doc.text(b.rotulo!, M, y);
      doc.setFont("helvetica", "normal"); doc.text(l1, M + wr, y);
      y += alt;
      const resto = b.txt!.slice(l1.length).trim();
      if (resto) paragrafo(resto, {}); else y += 1.6;
      y += 1.5;
    } else if (b.t === "p") paragrafo(b.txt!, {});
    else if (b.t === "l") paragrafo(b.txt!, { recuo: 5, depois: 1.1 });
    else if (b.t === "local") paragrafo(b.txt!, { antes: 6, depois: 4, alinhar: "left" });
    else if (b.t === "assinaturas") {
      garantir(70);
      const col = (x: number, linhas: [string, boolean][]) => {
        let yy = y + 18;
        doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.3); doc.line(x, yy - 6, x + 75, yy - 6);
        for (const [t, neg] of linhas) {
          doc.setFont("helvetica", neg ? "bold" : "normal"); doc.setFontSize(9.5);
          for (const ln of doc.splitTextToSize(t, 75) as string[]) { doc.text(ln, x, yy); yy += 4.6; }
        }
      };
      col(M, [["COMODANTE", true], ["INDEXA MÍDIA LTDA | www.examidia.com.br", false], ["CNPJ nº 38.142.638/0001-30", false], ["JEFERSON STILVER RODRIGUES ENCINA", true], ["Sócio administrador", false]]);
      col(W - M - 75, [["COMODATÁRIO", true], [d.condominio.trim().toUpperCase(), false], [`CNPJ nº ${formatarCnpj(d.cnpj)}`, false], [d.signatario.trim().toUpperCase(), true], [(d.cargo || "Síndico(a)").trim(), false]]);
      y += 60;
    }
  }
  // rodapé com página
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(130, 130, 130);
    doc.text(`Contrato de Comodato de Painel Digital EXA · ${d.condominio.trim()}`, M, H - 10);
    doc.text(`Página ${i} de ${total}`, W - M, H - 10, { align: "right" });
  }
  doc.setProperties({ title: `Contrato EXA - ${d.condominio.trim()}`, subject: `Comodato de painel digital (${MODELO_VERSAO})`, author: "Indexa Mídia LTDA (EXA Mídia)" });
  return new Uint8Array(doc.output("arraybuffer"));
}
