const puppeteer = require('puppeteer');

const waitForAnySelector = async (page, selectors) => await page.waitForSelector(selectors.join(','), { hidden: true });

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
        await page.goto(`http://nfe.pma.es.gov.br:8081/services/redirect_auth.php?auth=$1$TeJ44FC/$8tel11.w4o1I.q2Af9YAE/&codigo=${cpfOrCnpf.replace(/[^0-9]/g, '')}&tpc=01&tipo_consulta=${tipoDoc}&pagina=lancamentos_diversos.php?cod=MG`);

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
                        result: 0
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

    const returnTmrsInfo = await page.evaluate(async () => {
        const imoveisNodeList = [...document.querySelectorAll("div#parcelas_aberto > table")] || [];
        const imoveisDadosIncricao = [...document.querySelectorAll('div#parcelas_aberto > div:not(.mt-element-ribbon.bg-grey-steel)')] || [];

        if (imoveisNodeList.length === 0 && imoveisDadosIncricao.length === 0) {
            return {
                status: 200,
                description: 'Não existe parcela de TMRS lançada ou em aberto para o CPF/CNPJ informado',
                result: 0
            }
        }

        parcelasNodeList = imoveisNodeList.map((imovel, index) => {
            const [imoveisIncricao, imoveisEndereco] = (imoveisDadosIncricao[index].innerText).split(/\r\n|\n|\r/);
            const imovelDadosLink = [...imovel.querySelectorAll("tr")].map((parcelaDado, index) => {
                if (index === 0) return false;
                if (!!parcelaDado.querySelector("input.btn.btn-primary")) return false;

                const stringLinkDados = parcelaDado.querySelector("td:nth-child(2) > a")
                    .getAttribute('onclick')
                    .replace("window.open('", "")
                    .replaceAll("');", "")
                    .trim()
                    .split('&')

                return {
                    inscr_munic: imoveisIncricao.replace("Inscrição: ", "").trim(),
                    endereco: imoveisEndereco.replace("  ", " ").trim(),
                    linkDados: [
                        stringLinkDados[1].replace("inscricao=", "").trim(),
                        stringLinkDados[5].replace("codigo_cnt=", "").trim()
                    ],
                    parcela: (parcelaDado.querySelector("td:nth-child(5)").innerText).trim() === 'Cota Única' ? 0 : +(parcelaDado.querySelector("td:nth-child(5)").innerText).trim()
                }
            }).filter(parcela => parcela);

            const dadosLink = {
                inscr_munic: imovelDadosLink[0].inscr_munic,
                endereco: imovelDadosLink[0].endereco.replaceAll("  ", " ").trim(),
                inscricao: imovelDadosLink[0].linkDados[0],
                codigo_cnt: imovelDadosLink[0].linkDados[1],
                parcela: []
            }

            imovelDadosLink.forEach(item => dadosLink.parcela.push(item.parcela))

            return dadosLink
        });

        return {
            status: 200,
            description: imoveisNodeList.length,
            result: parcelasNodeList
        }
    })

    await browser.close();
    return returnTmrsInfo

});

module.exports = { getByCpfOrCnpj }