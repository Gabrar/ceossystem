import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const token = process.env.VERCEL_TOKEN?.trim();
    const projectId = process.env.VERCEL_PROJECT_ID?.trim();
    const teamId = process.env.VERCEL_TEAM_ID?.trim();

    if (!token || !projectId) {
      return NextResponse.json(
        {
          conectado: false,
          mensagem: "Variáveis VERCEL_TOKEN e VERCEL_PROJECT_ID não encontradas no ambiente.",
        },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get("periodo") || "dia"; // "dia" (7d), "mes" (30d), "ano"

    // O plano Hobby da Vercel permite dados dos últimos 31 dias
    const dias = periodo === "dia" ? 7 : 30;
    const sinceDate = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
    const since = sinceDate.toISOString();
    const until = new Date().toISOString();

    const baseUrl = "https://api.vercel.com/v1/query/web-analytics";
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const teamParam = teamId ? `&teamId=${teamId}` : "";
    const baseQuery = `projectId=${projectId}${teamParam}&since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`;

    // Realiza as consultas analíticas simultaneamente em paralelo para máxima velocidade
    const [
      resCount,
      resDays,
      resPaths,
      resReferrers,
      resDevices,
      resCountries,
      resBrowsers,
      resOs,
    ] = await Promise.all([
      fetch(`${baseUrl}/visits/count?${baseQuery}`, { headers, next: { revalidate: 60 } }),
      fetch(`${baseUrl}/visits/aggregate?${baseQuery}&by=day`, { headers, next: { revalidate: 60 } }),
      fetch(`${baseUrl}/visits/aggregate?${baseQuery}&by=requestPath`, { headers, next: { revalidate: 60 } }),
      fetch(`${baseUrl}/visits/aggregate?${baseQuery}&by=referrerHostname`, { headers, next: { revalidate: 60 } }),
      fetch(`${baseUrl}/visits/aggregate?${baseQuery}&by=deviceType`, { headers, next: { revalidate: 60 } }),
      fetch(`${baseUrl}/visits/aggregate?${baseQuery}&by=country`, { headers, next: { revalidate: 60 } }),
      fetch(`${baseUrl}/visits/aggregate?${baseQuery}&by=browserName`, { headers, next: { revalidate: 60 } }),
      fetch(`${baseUrl}/visits/aggregate?${baseQuery}&by=osName`, { headers, next: { revalidate: 60 } }),
    ]);

    const countJson = resCount.ok ? await resCount.json() : null;
    const daysJson = resDays.ok ? await resDays.json() : null;
    const pathsJson = resPaths.ok ? await resPaths.json() : null;
    const referrersJson = resReferrers.ok ? await resReferrers.json() : null;
    const devicesJson = resDevices.ok ? await resDevices.json() : null;
    const countriesJson = resCountries.ok ? await resCountries.json() : null;
    const browsersJson = resBrowsers.ok ? await resBrowsers.json() : null;
    const osJson = resOs.ok ? await resOs.json() : null;

    // Formata pontos diários para o gráfico com timezone UTC para evitar deslocamento de fuso
    const pontosGrafico = (daysJson?.data || []).map((item: any) => {
      const dt = new Date(item.timestamp);
      const label = dt.toLocaleDateString("pt-BR", {
        timeZone: "UTC",
        weekday: dias <= 7 ? "short" : undefined,
        day: "2-digit",
        month: dias > 7 ? "short" : undefined,
      });

      return {
        timestamp: item.timestamp,
        label,
        dataCompleta: dt.toLocaleDateString("pt-BR", {
          timeZone: "UTC",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          weekday: "long",
        }),
        visitors: item.visitors || 0,
        pageviews: item.pageviews || 0,
      };
    });

    // Total de visitantes e pageviews
    let totalVisitors = countJson?.data?.visitors || 0;
    let totalPageviews = countJson?.data?.pageviews || 0;

    // Se countJson vier 0 mas houver soma nos dias ou paths, usa a soma dos dias
    if (totalPageviews === 0 && pontosGrafico.length > 0) {
      totalPageviews = pontosGrafico.reduce((acc: number, p: any) => acc + (p.pageviews || 0), 0);
      totalVisitors = Math.max(
        ...pontosGrafico.map((p: any) => p.visitors || 0),
        totalVisitors
      );
    }

    // Calcula dia de pico
    let picoDia = null;
    if (pontosGrafico.length > 0) {
      const sorted = [...pontosGrafico].sort((a, b) => b.pageviews - a.pageviews);
      if (sorted[0]?.pageviews > 0) {
        picoDia = {
          data: sorted[0].dataCompleta,
          label: sorted[0].label,
          views: sorted[0].pageviews,
          visitors: sorted[0].visitors,
        };
      }
    }

    // Formata top páginas acessadas
    const topPaginas = (pathsJson?.data || [])
      .filter((p: any) => p.requestPath && p.requestPath !== "Others")
      .slice(0, 8)
      .map((p: any) => {
        let nomeAmigavel = p.requestPath;
        if (p.requestPath === "/") nomeAmigavel = "Página Inicial (Home)";
        else if (p.requestPath === "/admin/dashboard") nomeAmigavel = "Painel Admin (Dashboard)";
        else if (p.requestPath === "/admin/eventos") nomeAmigavel = "Admin (Eventos & Inscrições)";
        else if (p.requestPath === "/admin/usuarios") nomeAmigavel = "Admin (Usuários)";
        else if (p.requestPath === "/admin/admins") nomeAmigavel = "Admin (Gestão de Acessos)";
        else if (p.requestPath === "/login") nomeAmigavel = "Login / Autenticação";
        else if (p.requestPath.startsWith("/eventos/")) nomeAmigavel = `Evento: ${p.requestPath.replace("/eventos/", "")}`;
        else if (p.requestPath.startsWith("/usuario/painel")) nomeAmigavel = `Área do Promotor (${p.requestPath.replace("/usuario/painel", "") || "Início"})`;

        return {
          path: p.requestPath,
          nomeAmigavel,
          visitors: p.visitors || 0,
          pageviews: p.pageviews || 0,
        };
      });

    // Formata origens / referrers (fontes de tráfego)
    const fontesTrafego = (referrersJson?.data || []).map((r: any) => {
      let nome = r.referrerHostname;
      let tipo = "referral";
      if (!nome || nome === "") {
        nome = "Acesso Direto / Céos System";
        tipo = "direct";
      } else if (nome.includes("google")) {
        nome = "Google Busca";
        tipo = "search";
      } else if (nome.includes("instagram")) {
        nome = "Instagram";
        tipo = "social";
      } else if (nome.includes("whatsapp")) {
        nome = "WhatsApp";
        tipo = "social";
      } else if (nome.includes("facebook")) {
        nome = "Facebook";
        tipo = "social";
      } else if (nome.includes("t.co") || nome.includes("twitter") || nome.includes("x.com")) {
        nome = "Twitter / X";
        tipo = "social";
      }

      return {
        hostname: r.referrerHostname || "Direto",
        nome,
        tipo,
        visitors: r.visitors || 0,
        pageviews: r.pageviews || 0,
      };
    });

    // Formata dispositivos
    const dispositivos = (devicesJson?.data || []).map((d: any) => ({
      device: d.deviceType || "desktop",
      visitors: d.visitors || 0,
      pageviews: d.pageviews || 0,
    }));

    // Formata países
    const paises = (countriesJson?.data || []).slice(0, 6).map((c: any) => ({
      country: c.country || "BR",
      nomePais: c.country === "BR" ? "Brasil" : c.country === "US" ? "Estados Unidos" : c.country,
      visitors: c.visitors || 0,
      pageviews: c.pageviews || 0,
    }));

    // Formata navegadores
    const navegadores = (browsersJson?.data || []).slice(0, 5).map((b: any) => ({
      browser: b.browserName || "Outros",
      visitors: b.visitors || 0,
      pageviews: b.pageviews || 0,
    }));

    // Formata sistemas operacionais
    const sistemas = (osJson?.data || []).slice(0, 5).map((o: any) => ({
      os: o.osName || "Outros",
      visitors: o.visitors || 0,
      pageviews: o.pageviews || 0,
    }));

    return NextResponse.json({
      conectado: true,
      periodo,
      dias,
      projectId,
      totalVisitors,
      totalPageviews,
      mediaPorVisitante: totalVisitors > 0 ? (totalPageviews / totalVisitors).toFixed(1) : "1.0",
      picoDia,
      pontosGrafico,
      topPaginas,
      fontesTrafego,
      dispositivos,
      paises,
      navegadores,
      sistemas,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Vercel Analytics API Error]:", error);
    return NextResponse.json(
      {
        conectado: false,
        error: error?.message || "Erro interno ao consultar API da Vercel.",
      },
      { status: 500 }
    );
  }
}
