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
        await page.goto(`http://nfe.pma.es.gov.br:8081/services/redirect_auth.php?auth=$1$TeJ44FC/$8tel11.w4o1I.q2Af9YAE/&codigo=${cpfOrCnpf.replace(/[^0-9]/g, '')}&tpc=01&tipo_consulta=${tipoDoc}&pagina=consulta_bci.php`);

        try {
            await page.waitForSelector("div.blockUI.blockMsg.blockPage", {
                hidden: true
            })
            await page.waitForSelector("div#inscricoes", {
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

    const returnBci = await page.evaluate(async () => {
        const imoveisNodeList = [...document.querySelectorAll("#inscricoes table ~ br ~ table tr:nth-child( n + 2 )")] || [];

        if (imoveisNodeList.length !== 0) {

            const imovelDadosLink = imoveisNodeList.map(inscricoes => {
                const stringLinkDados = inscricoes.querySelector("td:nth-child(1) > a")
                    .getAttribute('href')
                    .trim()
                    .split('&')

                const inscricaoDados = inscricoes.querySelector("td:nth-child(2)").innerText

                return {
                    cd: stringLinkDados[0].replace("consulta_bci_impresso.php?cd=", "").trim(),
                    tpc: stringLinkDados[1].replace("tpc=", "").trim(),
                    insc: inscricaoDados
                }
            });

            return {
                status: 200,
                description: imoveisNodeList.length,
                result: imovelDadosLink
            }
        }
    });

    //console.log(returnBci)
    await browser.close();
    return returnBci
});

//getByCpfOrCnpj('11325723711', 'insc')
//getByCpfOrCnpj('11325723711', 'cpf')
//getByCpfOrCnpj('68169370744', 'cpf')
//getByCpfOrCnpj('01030250085001', 'insc')

module.exports = { getByCpfOrCnpj }