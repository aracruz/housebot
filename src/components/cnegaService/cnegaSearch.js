const puppeteer = require('puppeteer');

const getByCpfOrCnpj = (async (cpfOrCnpf, tipoDoc) => {

    const browser = await puppeteer.launch({
        userDataDir: '.ChromeSession',
        headless: true,
    });

    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(180000);
    await page.setViewport({
        width: 1333,
        height: 786
    })

    try {
        await page.goto(`http://nfe.pma.es.gov.br:8081/services/redirect_auth.php?auth=$1$TeJ44FC/$8tel11.w4o1I.q2Af9YAE/&codigo=${cpfOrCnpf.replace(/[^0-9]/g, '')}&tpc=01&tipo_consulta=${tipoDoc}&pagina=certidao_retirada.php`);

        try {
            await page.waitForSelector("div.blockUI.blockMsg.blockPage", {
                hidden: true
            })
            await page.waitForSelector("div#parcelas_aberto", {
                visible: true,
            })
        } catch (error) {
            try {
                const elBody = await page.$("body");
                const infoBody = await page.evaluate(elBody => elBody.innerText, elBody);

                if (infoBody.includes('Contribuinte não encontrado')) {
                    await browser.close();
                    return {
                        status: 200,
                        description: 'Contribuinte não encontrado',
                        result: -1
                    }
                }
            } catch (error) {
                await browser.close();
                return {
                    status: 500,
                    description: 'Error ao carregar a pagina'
                }
            }
        }
    } catch (error) {
        await browser.close();
        return {
            status: 500,
            description: 'Error ao carregar a pagina'
        }
    }

    const returnCnega = await page.evaluate(async () => {
        const linkResposta = document.querySelector("div#resposta a")
        return linkResposta ? linkResposta.getAttribute("href") : false;
    });

    if (returnCnega) {
        const pathPDF = `./store/cnega/certidao_${cpfOrCnpf.replace(/[^0-9]/g, '')}.pdf`
        await page.goto("http://nfe.pma.es.gov.br:8081/services/" + returnCnega);
        await page.pdf({ path: pathPDF, format: 'A4' });
        await browser.close();

        return {
            description: `certidao_${cpfOrCnpf.replace(/[^0-9]/g, '')}`,
            status: 200,
            result: 0
        }
    } else {

        // resultNavegation.message melhorar messagem e colovar em um .env 
        const msgDivida = await page.evaluate(async () => {
            const msgResposta = document.querySelector("div.sweet-alert h2+p.lead.text-muted")
            return msgResposta ? `Não foi possível gerar a certidão: Devido a possível existência de débitos.\nUse as opções abaixo para visualizar seus débitos ou entrar em contato com o setor de arrecadação para mais informações` : false;
        });
        await browser.close();

        return {
            description: cpfOrCnpf,
            message: msgDivida,
            status: 200,
            result: -1
        }
    }

});

//getByCpfOrCnpj('11325723711', 'insc')
//getByCpfOrCnpj('11325723711', 'cpf')

module.exports = { getByCpfOrCnpj }
