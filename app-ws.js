const WebSocket = require('ws');
const uuid = require('uuid');

let waiting_clients = 0;
let clients = [];
let partidas = {};
let tabuleiro_base = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

function getRandomTabuleiro(tabuleiro) {
    for(let i = 0; i < tabuleiro.length; i++) {
        for(let j = 0; j < tabuleiro[i].length; j++) {
            if(Math.random() < 0.2){
                tabuleiro[i][j] = 1;
            }
        }
    }
}
 
function onError(ws, err) {
    console.error(`onError: ${err.message}`);
}
 
function onMessage(ws, data) {
    console.log(`onMessage: ${data}`);
    const json = JSON.parse(data);
    ws.send(JSON.stringify({
        type: 'confirmation',
        data: 'Recebido'
    }));

    const msgArray = json.message.split(":");
    const x = msgArray[0]
    const y = msgArray[1]

    console.log(`x: ${x}, y: ${y}`);

    if (partidas[json.partida_id].jogador1.user_id == json.user_id) {
        if(partidas[json.partida_id].jogador2.tabuleiro[x][y] == 1){
            partidas[json.partida_id].jogador1.tabuleiro_adversario[x][y] = "x";
            partidas[json.partida_id].jogador2.tabuleiro[x][y] = "x"
        }
        else{
            partidas[json.partida_id].jogador1.tabuleiro_adversario[x][y] = "-";
            partidas[json.partida_id].jogador2.tabuleiro[x][y] = "-";
        }
    }
    else{
        if(partidas[json.partida_id].jogador1.tabuleiro[x][y] == 1){
            partidas[json.partida_id].jogador2.tabuleiro_adversario[x][y] = "x";
            partidas[json.partida_id].jogador1.tabuleiro[x][y] = "x"
        }
        else{
            partidas[json.partida_id].jogador2.tabuleiro_adversario[x][y] = "-";
            partidas[json.partida_id].jogador1.tabuleiro[x][y] = "-";
        }
    }

    console.log(`tabuleiro 1 meu pós: ${JSON.stringify(partidas[json.partida_id].jogador1.tabuleiro)}`);
    console.log(`tabuleiro 1 adv pós: ${JSON.stringify(partidas[json.partida_id].jogador1.tabuleiro_adversario)}`);
    console.log(`tabuleiro 2 meu pós: ${JSON.stringify(partidas[json.partida_id].jogador2.tabuleiro)}`);
    console.log(`tabuleiro 2 adv pós: ${JSON.stringify(partidas[json.partida_id].jogador2.tabuleiro_adversario)}`);
    
    partidas[json.partida_id].jogador1.client.send(
        JSON.stringify({
            type: 'update',
            tabuleiro: partidas[json.partida_id].jogador1.tabuleiro,
            tabuleiro_adversario: partidas[json.partida_id].jogador1.tabuleiro_adversario,
        })
    );

    partidas[json.partida_id].jogador2.client.send(
        JSON.stringify({
            type: 'update',
            tabuleiro: partidas[json.partida_id].jogador2.tabuleiro,
            tabuleiro_adversario: partidas[json.partida_id].jogador2.tabuleiro_adversario,
        })
    );
}

function onClose(ws, reasonCode, description) {
    console.log(`onClose: ${reasonCode} - ${description}`);
    const index = clients.indexOf(ws);
    if (index > -1) {
        clients.splice(index, 1);
    }
    waiting_clients--;
}
 
function onConnection(ws, req) {
    clients.push(ws);
    waiting_clients++;
    console.log(`onConnection`);
    console.log(`Jogadores Esperando: ${waiting_clients}`);
    if (waiting_clients >= 2) {
        console.log(`Quantidade mínima de jogadores atingida. Partida formada!`);
        let id  = uuid.v4();
        let user_ids = [uuid.v4(), uuid.v4()];
        
        let tab1 = JSON.parse(JSON.stringify(tabuleiro_base));
        let tab1adv = JSON.parse(JSON.stringify(tabuleiro_base));
        getRandomTabuleiro(tab1);

        let tab2 = JSON.parse(JSON.stringify(tabuleiro_base));
        let tab2adv = JSON.parse(JSON.stringify(tabuleiro_base));
        getRandomTabuleiro(tab2);

        partidas[id] = {
            jogador1: {
                client: clients[0],
                user_id: user_ids[0],
                websocket: 0,
                tabuleiro: tab1,
                tabuleiro_adversario: tab1adv
            },
            jogador2: {
                client: clients[1],
                user_id: user_ids[1],
                websocket: 0,
                tabuleiro: tab2,
                tabuleiro_adversario: tab2adv
            },
            situacao: 0,
            vencedor: -1,
            vez: 0
        }

        console.log(`tabuleiro 1 meu pós: ${JSON.stringify(partidas[id].jogador1.tabuleiro)}`);
        console.log(`tabuleiro 1 adv pós: ${JSON.stringify(partidas[id].jogador1.tabuleiro_adversario)}`);
        console.log(`tabuleiro 2 meu pós: ${JSON.stringify(partidas[id].jogador2.tabuleiro)}`);
        console.log(`tabuleiro 2 adv pós: ${JSON.stringify(partidas[id].jogador2.tabuleiro_adversario)}`);

        partidas[id].jogador1.client.send(
            JSON.stringify({
                type: 'game_start',
                partida_id: id,
                user_id: user_ids[0],
                tabuleiro: partidas[id].jogador1.tabuleiro,
                tabuleiro_adversario: partidas[id].jogador1.tabuleiro_adversario,
            })
        );
        partidas[id].jogador2.client.send(
            JSON.stringify({
                type: 'game_start',
                partida_id: id,
                user_id: user_ids[1],
                tabuleiro: partidas[id].jogador2.tabuleiro,
                tabuleiro_adversario: partidas[id].jogador2.tabuleiro_adversario,
            })
        );

        clients = [];
        waiting_clients = 0;
    }

    ws.on('message', data => onMessage(ws, data));
    ws.on('error', error => onError(ws, error));
    ws.on('close', (reasonCode, description) => onClose(ws, reasonCode, description));
    ws.send(JSON.stringify({
        type: 'connection',
        data: 'Bem vindo'
    }))
}
 
module.exports = (server) => {
    const wss = new WebSocket.Server({
        server
    });
 
    wss.on('connection', onConnection);
 
    console.log(`App Web Socket Server is running!`);
    return wss;
}