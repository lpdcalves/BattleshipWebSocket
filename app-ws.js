const WebSocket = require('ws');
const uuid = require('uuid');

let waiting_clients = 0;
let clients = [];
let partidas = {};
let tabuleiro_base = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
const STATUS_SETUP = 0;
const STATUS_START = 1;
const STATUS_READY = 2;
const STATUS_FINISHED = 3;


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

    if(partidas[json.partida_id] != null){
        const x = json.messageX;
        const y = json.messageY;
        console.log(`x: ${x}, y: ${y}`);
        let id = json.partida_id;

        // index do jogador atual;
        idx = partidas[id].jogadores[0].user_id == json.user_id ? 0 : 1;
        
        // Se a partida acabou
        if(partidas[id].status == STATUS_FINISHED){
            partidas[id].jogadores[idx].client.send(
                JSON.stringify({
                    type: 'notify',
                    message: 'A Partida Acabou!!! Para continuar jogando recarregue a página e espere uma partida começar',
                })
            );
            return;
        }
        // Se estamos na preparação
        else if(partidas[id].status == STATUS_SETUP){
            // Se o jogador ainda tem barcos para serem colocados
            if(partidas[id].jogadores[idx].qtd_barcos > 0 ){
                if(partidas[id].jogadores[idx].tabuleiro[y][x] != 1){
                    // TODO: colocar aqui a lógica dos tipos de barco diferentes
                    partidas[id].jogadores[idx].tabuleiro[y][x] = 1;
                    partidas[id].jogadores[idx].qtd_barcos -= 1;
                    console.log(`Barco colocado pelo jogador ${idx} na posição x: ${x}, y: ${y}`);
                    // Se usar todos os barcos
                    if(partidas[id].jogadores[idx].qtd_barcos == 0){
                        partidas[id].jogadores[idx].status = STATUS_READY;
                        console.log(`Jogador ${idx} colocou todos os barcos`);
                        // Se o outro jogador já estiver pronto, dá começo a partida
                        if(partidas[id].jogadores[(idx+1) % 2].status == STATUS_READY){
                            partidas[id].status = STATUS_START
                            console.log(`A partida vai começar`);
                            partidas[id].jogadores[0].status = STATUS_START
                            partidas[id].jogadores[1].status = STATUS_START
                            partidas[id].jogadores[0].client.send(
                                JSON.stringify({
                                    type: 'notify',
                                    message: 'A Partida Começou!!! Boa Sorte.',
                                })
                            );
                            partidas[id].jogadores[1].client.send(
                                JSON.stringify({
                                    type: 'notify',
                                    message: 'A Partida Começou!!! Boa Sorte.',
                                })
                            );
                        }
                    }
                }
            }
            else{
                partidas[id].jogadores[idx].client.send(
                    JSON.stringify({
                        type: 'notify',
                        message: 'Você já colocou todos os seus barcos, espere o adversário colocar os barcos. \
                                Seu adversário ainda precisa colocar mais ' + partidas[id].jogadores[(idx+1) % 2].qtd_barcos + ' barcos.',
                    })
                );
            }
        }
        // Se a partida está com o status STATUS_START
        else{
            // Se o jogador que está fazendo a jogada é o que está com a vez damos prosseguimento
            console.log(`Vez: ${partidas[id].vez}`);
            if(partidas[id].vez == idx){
                console.log(`Idx inimigo: ${(idx+1) % 2}`);
                // Se acertou
                if(partidas[id].jogadores[(idx+1) % 2].tabuleiro[y][x] == 1){
                    partidas[id].jogadores[idx].tabuleiro_adversario[y][x] = "x";
                    partidas[id].jogadores[(idx+1) % 2].tabuleiro[y][x] = "x";
                    partidas[id].jogadores[(idx+1) % 2].vida -= 1;
                    if(partidas[id].jogadores[(idx+1) % 2].vida == 0){
                        partidas[id].vencedor = idx
                        console.log(`O jogador ${idx} venceu a partida!`);
                    }
                    console.log("acertou");
                }
                // Se errou
                else{
                    partidas[id].jogadores[idx].tabuleiro_adversario[y][x] = "-";
                    partidas[id].jogadores[(idx+1) % 2].tabuleiro[y][x] = "-";
                    console.log("errou");
                }
                partidas[id].vez = (partidas[id].vez+1) % 2;
            }
            else{
                partidas[id].jogadores[idx].client.send(
                    JSON.stringify({
                        type: 'updt_instrucoes',
                        message: 'Não é sua vez! Espere o adversário jogar.',
                    })
                );
            }
        }

        console.log(`tabuleiro 0 meu pós: ${JSON.stringify(partidas[id].jogadores[0].tabuleiro)}`);
        console.log(`tabuleiro 0 adv pós: ${JSON.stringify(partidas[id].jogadores[0].tabuleiro_adversario)}`);
        console.log(`tabuleiro 1 meu pós: ${JSON.stringify(partidas[id].jogadores[1].tabuleiro)}`);
        console.log(`tabuleiro 1 adv pós: ${JSON.stringify(partidas[id].jogadores[1].tabuleiro_adversario)}`);
        
        if(partidas[id].status == STATUS_START){
            if(partidas[id].vencedor == -1){
                for (let i = 0; i < partidas[id].jogadores.length; i++ ) {
                    let instr;
                    instr = i == partidas[id].vez ? "É sua vez." : "Não é sua vez, aguarde.";
                    partidas[id].jogadores[i].client.send(
                        JSON.stringify({
                            type: 'update',
                            tabuleiro: partidas[id].jogadores[i].tabuleiro,
                            tabuleiro_adversario: partidas[id].jogadores[i].tabuleiro_adversario,
                            qtd_barcos: partidas[id].jogadores[i].qtd_barcos,
                            instrucao: instr
                        })
                    );
                }
            }
            else{
                let w = partidas[id].vencedor;
                partidas[id].jogadores[w].client.send(
                    JSON.stringify({
                        type: 'update',
                        tabuleiro: partidas[id].jogadores[w].tabuleiro,
                        tabuleiro_adversario: partidas[id].jogadores[w].tabuleiro_adversario,
                        qtd_barcos: partidas[id].jogadores[w].qtd_barcos,
                        instrucao: "Parabéns, você venceu!",
                    })
                );
                partidas[id].jogadores[(w+1)%2].client.send(
                    JSON.stringify({
                        type: 'update',
                        tabuleiro: partidas[id].jogadores[(w+1)%2].tabuleiro,
                        tabuleiro_adversario: partidas[id].jogadores[(w+1)%2].tabuleiro_adversario,
                        qtd_barcos: partidas[id].jogadores[(w+1)%2].qtd_barcos,
                        instrucao: "Que pena, você perdeu!",
                    })
                );

                partidas[id].status = STATUS_FINISHED;
            }
            
        }
        else{
            for (let i = 0; i < partidas[id].jogadores.length; i++ ) {
                partidas[id].jogadores[i].client.send(
                    JSON.stringify({
                        type: 'update',
                        tabuleiro: partidas[id].jogadores[i].tabuleiro,
                        tabuleiro_adversario: partidas[id].jogadores[i].tabuleiro_adversario,
                        qtd_barcos: partidas[id].jogadores[i].qtd_barcos,
                        instrucao: "Você tem: " + partidas[id].jogadores[i].qtd_barcos + " Navios para colocar. Digite uma coordenada x e y e envie para colocar um navio.",
                    })
                );
            }
        }
    }
}

function onClose(ws, reasonCode, description) {
    if(clients.includes(ws)){
        waiting_clients--;
    }
    console.log(`onClose: ${reasonCode} - ${description}`);
    const index = clients.indexOf(ws);
    if (index > -1) {
        clients.splice(index, 1);
    }
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
        //getRandomTabuleiro(tab1);

        let tab2 = JSON.parse(JSON.stringify(tabuleiro_base));
        let tab2adv = JSON.parse(JSON.stringify(tabuleiro_base));
        //getRandomTabuleiro(tab2);

        partidas[id] = {
            jogadores: [{
                    client: clients[0],
                    user_id: user_ids[0],
                    tabuleiro: tab1,
                    tabuleiro_adversario: tab1adv,
                    qtd_barcos: 5,
                    vida: 5,
                    status: STATUS_SETUP
                },
                {
                    client: clients[1],
                    user_id: user_ids[1],
                    tabuleiro: tab2,
                    tabuleiro_adversario: tab2adv,
                    qtd_barcos: 5,
                    vida: 5,
                    status: STATUS_SETUP
                }],
            status: STATUS_SETUP,
            vencedor: -1,
            vez: 0
        }

        for (let i = 0; i < partidas[id].jogadores.length; i++ ) {
            partidas[id].jogadores[i].client.send(
                JSON.stringify({
                    type: 'game_setup',
                    partida_id: id,
                    user_id: user_ids[i],
                    tabuleiro: partidas[id].jogadores[i].tabuleiro,
                    tabuleiro_adversario: partidas[id].jogadores[i].tabuleiro_adversario,
                    qtd_barcos: partidas[id].jogadores[i].qtd_barcos,
                    instrucao: "Você tem: " + partidas[id].jogadores[i].qtd_barcos + " Navios para colocar. Digite uma coordenada x e y e envie para colocar um navio.",
                })
            );
        }
        for (let i = 0; i < partidas[id].jogadores.length; i++ ) {
            partidas[id].jogadores[i].client.send(
                JSON.stringify({
                    type: 'notify',
                    message: 'Partida Iniciada!'
                })
            );
        }

        // partidas[id].jogadores[0].client.send(
        //     JSON.stringify({
        //         type: 'game_setup',
        //         partida_id: id,
        //         user_id: user_ids[0],
        //         tabuleiro: partidas[id].jogadores[0].tabuleiro,
        //         tabuleiro_adversario: partidas[id].jogadores[0].tabuleiro_adversario,
        //         qtd_barcos: partidas[id].jogadores[0].qtd_barcos,
        //     })
        // );
        // partidas[id].jogadores[0].client.send(
        //     JSON.stringify({
        //         type: 'notify',
        //         message: 'Partida Iniciada!'
        //     })
        // );

        // partidas[id].jogadores[1].client.send(
        //     JSON.stringify({
        //         type: 'game_setup',
        //         partida_id: id,
        //         user_id: user_ids[1],
        //         tabuleiro: partidas[id].jogadores[1].tabuleiro,
        //         tabuleiro_adversario: partidas[id].jogadores[1].tabuleiro_adversario,
        //         qtd_barcos: partidas[id].jogadores[1].qtd_barcos,
        //     })
        // );
        // partidas[id].jogadores[1].client.send(
        //     JSON.stringify({
        //         type: 'notify',
        //         message: 'Partida Iniciada!'
        //     })
        // );

        clients = [];
        waiting_clients = 0;
    }
    else{
        ws.send(
            JSON.stringify({
                type: 'notify',
                message: "Você foi conectado ao servidor! aguarde outro jogador se conectar para iniciar sua partida."
            })
        );
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