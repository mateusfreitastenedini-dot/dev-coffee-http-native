const http = require('node:http');
const { URL } = require('node:url');

const PORT = 3000;

const pedidos = [];
let proximoId = 1;

const statusValidos = ['pendente', 'pronto', 'cancelado'];

function enviarResposta(res, statusCode, dados = null) {
  // Resposta 204 não deve ter corpo nem cabeçalho JSON.
    if (statusCode === 204) {
        res.writeHead(204);
        res.end();
        return;
    }

    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8'
    });

    res.end(JSON.stringify(dados));
}
function lerCorpo(req) {
    return new Promise((resolve, reject) => {
        let corpo = '';

        req.on('data', (parte) => {
            corpo += parte;
        });

        req.on('end', () => {
            try {
                resolve(JSON.parse(corpo));
            } catch (erro) {
                reject(new Error('O corpo da requisição contém um JSON inválido.'));
            }
        });

        req.on('error', reject);
    });
}

function buscarPedidoPorId(idRecebido) {
    const id = Number(idRecebido);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return pedidos.find((pedido) => pedido.id === id) || null;
}

function validarTexto(valor) {
    return typeof valor === 'string' && valor.trim().length > 0;
}

async function tratarRequisicao(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const caminho = url.pathname;
    const metodo = req.method;

    // Lista todos os pedidos ou aplica o filtro informado na query string.
    if (metodo === 'GET' && caminho === '/orders') {
        const statusFiltro = url.searchParams.get('status');

        const resultado = statusFiltro
            ? pedidos.filter((pedido) => pedido.status === statusFiltro)
            : pedidos;

        enviarResposta(res, 200, resultado);
        return;
    }

    // Busca um pedido específico pelo ID.
    const rotaPedido = caminho.match(/^\/orders\/([^/]+)$/);

    if (metodo === 'GET' && rotaPedido) {
        const pedido = buscarPedidoPorId(rotaPedido[1]);

        if (!pedido) {
            enviarResposta(res, 404, { erro: 'Pedido não encontrado.' });
            return;
        }

        enviarResposta(res, 200, pedido);
        return;
    }

    // Cria um pedido com ID sequencial e status inicial pendente.
    if (metodo === 'POST' && caminho === '/orders') {
        let dados;

        try {
            dados = await lerCorpo(req);
        } catch (erro) {
            enviarResposta(res, 400, { erro: erro.message });
            return;
        }

        if (!dados || !validarTexto(dados.client) || !validarTexto(dados.item)) {
            enviarResposta(res, 400, {
                erro: 'Informe os campos client e item como textos não vazios.'
            });
            return;
        }

        const novoPedido = {
            id: proximoId++,
            client: dados.client.trim(),
            item: dados.item.trim(),
            status: 'pendente'
        };

        pedidos.push(novoPedido);
        enviarResposta(res, 201, novoPedido);
        return;
    }

    // Atualiza somente o status do pedido.
    const rotaStatus = caminho.match(/^\/orders\/([^/]+)\/status$/);

    if (metodo === 'PATCH' && rotaStatus) {
        const pedido = buscarPedidoPorId(rotaStatus[1]);

        if (!pedido) {
            enviarResposta(res, 404, { erro: 'Pedido não encontrado.' });
            return;
        }

        let dados;

        try {
            dados = await lerCorpo(req);
        } catch (erro) {
            enviarResposta(res, 400, { erro: erro.message });
            return;
        }

        if (!dados || !statusValidos.includes(dados.status)) {
            enviarResposta(res, 400, {
                erro: `Status inválido. Use: ${statusValidos.join(', ')}.`
            });
            return;
        }

        pedido.status = dados.status;
        enviarResposta(res, 200, pedido);
        return;
    }

    // Remove o pedido. A resposta 204 não deve conter corpo.
    if (metodo === 'DELETE' && rotaPedido) {
        const id = Number(rotaPedido[1]);

        if (!Number.isInteger(id) || id <= 0) {
            enviarResposta(res, 404, { erro: 'Pedido não encontrado.' });
            return;
        }

        const indice = pedidos.findIndex((pedido) => pedido.id === id);

        if (indice === -1) {
            enviarResposta(res, 404, { erro: 'Pedido não encontrado.' });
            return;
        }

        pedidos.splice(indice, 1);
        enviarResposta(res, 204);
        return;
    }

    // Qualquer combinação de rota e método não prevista retorna 404.
    enviarResposta(res, 404, { erro: 'Rota ou método não encontrado.' });
}

const servidor = http.createServer((req, res) => {
    tratarRequisicao(req, res).catch((erro) => {
        console.error('Erro ao processar requisição:', erro);
        if (!res.headersSent) {
            enviarResposta(res, 500, { erro: 'Erro interno do servidor.' });
        }
    });
});

servidor.listen(PORT, () => {
    console.log(`Dev Coffee API disponível em http://localhost:${PORT}`);
});
