const ws = new WebSocket("ws://" + location.host);
let msgX;
let msgY;
let chat;
let cabecalho;
let notificacoes;
let instrucoes;
let popups;
let username; // nome do usuário
let partida_id;
let user_id;
let navios_para_colocar;
let tile_types = {
    "agua": "~",
    "navio": "#",
    "miss": "O",
    "hit": "X",
};

let tabuleiro;
let tabuleiro_adversario;

function atualiza_tabuleiro(json){
    // limpa o chat
    chat.innerHTML = "";

    // atualiza o tabuleiro do cliente.
    tabuleiro = json.tabuleiro;
    tabuleiro_adversario = json.tabuleiro_adversario;

    const divEsquerda = document.createElement("DIV");
    divEsquerda.style = "width:300px; float:left;";
    const divTabuleiro = document.createElement("DIV");
    divTabuleiro.innerHTML = "<br/> Tabuleiro: <br/>";
    divEsquerda.appendChild(divTabuleiro);

    let table_1 = document.createElement("table");
    for(let i = 0; i < tabuleiro.length; i++) {
        let tr = document.createElement("tr");
        for(let j = 0; j < tabuleiro[i].length; j++) {
            let td = document.createElement("td");
            if(tabuleiro[i][j] == tile_types["agua"]){
                td.style = "color: blue";
            }
            else if(tabuleiro[i][j] == tile_types["navio"]){
                td.style = "color: green";
            }
            else if(tabuleiro[i][j] == tile_types["hit"]){
                td.style = "color: red";
            }
            else{
                td.style = "color: orange";
            }
            td.innerHTML = tabuleiro[i][j]
            tr.appendChild(td);
        }
        table_1.appendChild(tr);
    }
    divEsquerda.appendChild(table_1);
    chat.appendChild(divEsquerda);

    const divDireita = document.createElement("DIV");
    divDireita.style = "width:300px; float:left;";
    const divTabuleiroAdv = document.createElement("DIV");
    divTabuleiroAdv.innerHTML = "<br/> Tabuleiro Adversário: <br/>";
    divDireita.appendChild(divTabuleiroAdv);

    let table_2 = document.createElement("table");
    for(let i = 0; i < tabuleiro_adversario.length; i++) {
        let tr = document.createElement("tr");
        for(let j = 0; j < tabuleiro_adversario[i].length; j++) {
            let td = document.createElement("td");
            if(tabuleiro_adversario[i][j] == "~"){
                td.style = "color: blue";
            }
            else if(tabuleiro_adversario[i][j] == "1"){
                td.style = "color: green";
            }
            else if(tabuleiro_adversario[i][j] == "X"){
                td.style = "color: red";
            }
            else{
                td.style = "color: orange";
            }
            td.innerHTML = tabuleiro_adversario[i][j]
            tr.appendChild(td);
        }
        table_2.appendChild(tr);
    }
    divDireita.appendChild(table_2);
    chat.appendChild(divDireita);

    const divLegenda = document.createElement("DIV");
    divLegenda.style = "width:300px; float:left;";
    divLegenda.innerHTML = `<br/> <br/> <br/> <br/> Legenda: <br/> ${tile_types["agua"]}: Água; <br/> ${tile_types["navio"]}: Navio; <br/> ${tile_types["miss"]}: Bomba na água; <br/> ${tile_types["hit"]}: Bomba em navio; <br/>`;
    chat.appendChild(divLegenda);
}

function atualiza_instrucoes(msg){
    instrucoes.innerHTML = '';
    const divInstrucao = document.createElement("DIV");
    divInstrucao.className = "instrucoes";
    divInstrucao.innerHTML = msg;
    instrucoes.appendChild(divInstrucao);
}

function atualiza_popup(msg){
    popups.innerHTML = '';
    const divPopup = document.createElement("DIV");
    divPopup.className = "popups";
    divPopup.innerHTML = msg;
    popups.appendChild(divPopup);
}

ws.onmessage = (event) => {        
    console.log(event.data);
    const json = JSON.parse(event.data);
    console.log('json', json);

    if (json.type == "game_setup") {
        partida_id = json.partida_id;
        user_id = json.user_id;
        navios_para_colocar = json.qtd_barcos;
        const divIDPartida = document.createElement("DIV");
        const divIDUser = document.createElement("DIV");
        divIDPartida.innerHTML = "ID da Partida: " + json.partida_id;
        divIDUser.innerHTML = "ID do usuário: " + json.user_id;
        cabecalho.appendChild(divIDPartida);
        cabecalho.appendChild(divIDUser);

        atualiza_instrucoes("Você tem: " + navios_para_colocar + " Navios para colocar. Digite uma coordenada x e y e envie para colocar um navio.");
        atualiza_tabuleiro(json);
    }

    if (json.type == "notify") {
        notificacoes.innerHTML = '';
        const divNotificacao = document.createElement("DIV");
        divNotificacao.className = "notificacoes";
        divNotificacao.innerHTML = json.message;
        notificacoes.appendChild(divNotificacao);
    }

    if (json.type == "updt_instrucoes") {
        atualiza_instrucoes(json.message);
    }

    if (json.type == "popup") {
        atualiza_popup(json.message);
    }

    if (json.type == 'update') {
        atualiza_instrucoes(json.instrucao);
        atualiza_tabuleiro(json);
    }
}

// Função para enviar mensagem que é executada quando se clica no botão
function send() {
    // verifica se o campo de texto da mensagem está vazio
    if (username.value == "") {
        alert("Por favor, digite um nome de usuário!");
        username.focus();
        return;
    }

    // verifica se a mensagem X está vazia
    if (msgX.value == "") {
        alert("Por favor, digite uma coordenada X!");
        msgX.focus();
        return;
    }

    // verifica se a mensagem Y está vazia
    if (msgY.value == "") {
        alert("Por favor, digite uma coordenada Y!");
        msgY.focus();
        return;
    }

    // Envia o texto digitado para o servidor pelo WebSocket (Um objeto convertido para string)
    ws.send(JSON.stringify({
        type: 'message', 
        partida_id: partida_id,
        user_id: user_id,
        username: username.value,
        messageX: msgX.value,
        messageY: msgY.value
    }));

    // Limpa o campo de texto da mensagem
    // msgX.value = '';
    // msgy.value = '';
}

// Função para enviar mensagem que é executada quando se aperta Enter no campo de texto da mensagem
function pressionouTecla(event) {
    if (event.keyCode == 13) { // 13 é o código para a tecla Enter
        send(); // Envia a mensagem
    }
}

window.addEventListener('load', (e) => {
    console.log('load')
    username = document.getElementById('username');
    msgX = document.getElementById('messageX');
    msgY = document.getElementById('messageY');
    chat = document.getElementById('chat');
    cabecalho = document.getElementById('cabecalho');
    notificacoes = document.getElementById('notificacoes');
    instrucoes = document.getElementById('instrucoes');
    popups = document.getElementById('popups');
});

