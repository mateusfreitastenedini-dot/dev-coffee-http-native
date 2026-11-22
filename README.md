# Dev Coffee API

API REST em memória para gerenciamento de pedidos da cafeteria Dev Coffee, desenvolvida com o módulo HTTP nativo do Node.js, sem Express ou dependências externas.

**Autor:** //Mateus Tenedini

## Requisitos

- Node.js instalado.
- Não é necessário executar `npm install`, pois o projeto utiliza somente módulos nativos.

## Como executar

1. Abra a pasta do projeto no terminal.
2. Execute:

```bash
npm start
```

3. O servidor ficará disponível em:

```text
http://localhost:3000
```

Os pedidos ficam armazenados em memória. Portanto, são apagados quando o servidor é encerrado.

## Modelo de pedido

```json
{
  "id": 1,
  "client": "Nome do cliente",
  "item": "Nome do café",
  "status": "pendente"
}
```

Os status aceitos são `pendente`, `pronto` e `cancelado`.

## Rotas disponíveis

### 1. Listar pedidos

```bash
curl http://localhost:3000/orders
```

Também é possível filtrar pelo status:

```bash
curl "http://localhost:3000/orders?status=pendente"
```

### 2. Buscar pedido por ID

```bash
curl http://localhost:3000/orders/1
```

### 3. Criar pedido

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{\"client\":\"Mateus\",\"item\":\"Café expresso\"}"
```

O ID é gerado automaticamente e o status inicial é `pendente`.

### 4. Atualizar status

```bash
curl -X PATCH http://localhost:3000/orders/1/status \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"pronto\"}"
```

Somente o campo `status` é alterado. Os valores aceitos são `pendente`, `pronto` e `cancelado`.

### 5. Excluir pedido

```bash
curl -X DELETE http://localhost:3000/orders/1
```

Quando a exclusão é realizada, a API retorna `204 No Content`, sem corpo na resposta.

## Respostas e validações

- `200 OK`: consulta ou atualização realizada.
- `201 Created`: pedido criado.
- `204 No Content`: pedido excluído com sucesso.
- `400 Bad Request`: JSON inválido, campos obrigatórios ausentes ou status não permitido.
- `404 Not Found`: pedido inexistente ou rota/método não previsto.

As respostas que possuem corpo utilizam `Content-Type: application/json; charset=utf-8`.

A leitura dos corpos das requisições POST e PATCH é feita pelos eventos `data` e `end` da stream da requisição. O `JSON.parse` é protegido por `try/catch` para tratar conteúdos inválidos sem encerrar o servidor.

## Tecnologias

- Node.js
- Módulos nativos `http` e `url`
- JavaScript
