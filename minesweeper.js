const DIMENTION = 26;
const SELECTED = "rgb(212, 212, 212)";
const BOMB_SELECTED = "rgb(255 104 104)";
const GRIGLIA = [];
const FLAG_IMAGE = "url('./img/flag_icon.png')";
const BOMB_IMAGE = "url('./img/bomb_icon.png')";
const COLORS = {
    PURPLE: "rgba(77,54,208,1)",
    RED: "red",
    GREEN: "#00af00",
    YELLOW: "rgb(139 98 4)",
    CYAN: "rgb(0 177 195)"
}
let state = 0;
let bombNum = 0;
let undiscovered;
//controls
//left-click
function keyAction(key){
    const cell = key.srcElement.id;
    if(!cell)
        return;
    const mid = cell.indexOf("-"), fst = Number(cell.slice(0, mid)), snd = Number(cell.slice(mid+1, cell.length));
    if(!state){
        loadGame(fst, snd);
    }else if(state == 1){
        if(isImageSet(fst, snd)){
            changeBgImage(fst,snd, "");
            bombNum++;
            setCounter(bombNum);
        }
        else{
            reveal(fst, snd);
        }
    }
}
//right-click
function flag(key){
    const cell = key.srcElement.id;
    if(!cell)
        return;
    const mid = cell.indexOf("-"), fst = Number(cell.slice(0, mid)), snd = Number(cell.slice(mid+1, cell.length));
    if(isSelected(fst, snd) || state != 1){
        return;
    }else{
        if(isImageSet(fst, snd)){
            changeBgImage(fst,snd, "");
            bombNum++;
        }
        else if(bombNum>0){
            changeBgImage(fst,snd, FLAG_IMAGE);
            bombNum--;
        }
        setCounter(bombNum);
    }
}
//grid generation
function initialize(){
    for(let i=0; i<DIMENTION; i++){
        const tmp = [];
        for(let j=0; j<DIMENTION; j++){
            tmp.push(1);
            let tile = document.createElement("div");
            tile.classList.add("tile");
            tile.id = i.toString() + "-" + j.toString();
            tile.onclick = keyAction;
            tile.oncontextmenu = flag;
            document.getElementById("board").appendChild(tile);
        }
        GRIGLIA.push(tmp);
    }
}
//bomb, spaces and numbers generation
function loadGame(fst,snd){
    undiscovered = DIMENTION*DIMENTION;
    const mode = document.getElementsByName("difficulty");
    let difficulty, bombs;
    for(let i of mode){
        if(i.checked)
            difficulty = i.value;
    }
    bombs = (difficulty == 1)?70:(difficulty == 2)?100:130;
    difficulty*=0.1;
    const picked = createVoid(fst, snd);
    for(let i=0; i<DIMENTION; i++){
        for(let j=0; j<DIMENTION; j++){
            if(bombNum>=bombs)
                break;
            if(isNotHoleNear(i, j) && (Math.random() < 0.1)&&(i<=2 || !(GRIGLIA[i-1][j] == GRIGLIA[i-2][j] && GRIGLIA[i-1][j] == 0))&&(j<=2 || !(GRIGLIA[i][j-1] == GRIGLIA[i][j-2] && GRIGLIA[i][j-1] == 0))){
                GRIGLIA[i][j] = 0;
                bombNum++;
            }
            if(i==j&&j==DIMENTION-1){
                i=0;
                j=0;
            }
        }
    }
    undiscovered-=bombNum;
    for(let i=0; i<DIMENTION; i++){
        for(let j=0; j<DIMENTION; j++){
            if(GRIGLIA[i][j]){
                GRIGLIA [i][j] = countAny(i, j, (x, y)=>(!GRIGLIA[x][y]));
                if(GRIGLIA [i][j] == -1){
                    continue;
                }
            }
        }
    }
    for(let i of picked){
        selectCells(i[0], i[1]);
    }
    setCounter(bombNum);
    state++;
    document.getElementById("state").innerHTML = "";
    showTime(0);
}
//generate empty cells
function createVoid(i, j){
    const picked = [];
    let n = Math.floor(Math.random() * (18 - 8 + 1) + 8);
    while(n>0){
        changeColor(i, j, SELECTED);
        GRIGLIA[i][j] = -1;
        if(!alreadyIn(picked, i, j))
            picked.push([i,j]);
        n--;
        const direction = Math.random();
        if(direction < 0.25){
            if(i>0)
                i--;
        }else if(direction < 0.5){
            if(i<DIMENTION-1)
                i++;
        }else if(direction < 0.75){
            if(j>0)
                j--;
        }else{
            if(j<DIMENTION-1)
                j++;
        }
    }
    return picked;
}
//reveal cell
function reveal(i, j){
    const value = GRIGLIA[i][j];
    if(value){
        if(isSelected(i,j)){
            inspectNear(i, j);
        }else{
            changeColor(i, j, SELECTED);
            if(value == -1){
                selectCells(i, j);
            }else
                setValue(i, j, GRIGLIA[i][j]);
        }
    }else{
        state++;
        document.getElementById("state").innerHTML = "Game Over";
        changeColor(i, j, BOMB_SELECTED);
        changeBgImage(i, j, BOMB_IMAGE);
        showBombs();
    }
}
//apply function to all near cells
function applyNear(f, i, j, cond){
    let k=0;
    if(i>0){
        if(cond(i-1, j)){
            k+=f(i-1, j);
        }
        if(j>0 && cond(i-1, j-1)){
            k+=f(i-1, j-1);
        }
        if(j<DIMENTION-1 && cond(i-1, j+1)){
            k+=f(i-1, j+1);
        }
    }
    if(i<DIMENTION-1){
        if(cond(i+1, j)){
            k+=f(i+1, j);
        }
        if(j>0 && cond(i+1, j-1)){
            k+=f(i+1, j-1);
        }
        if(j<DIMENTION-1 && cond(i+1, j+1)){
            k+=f(i+1, j+1);
        }
    }
    if(j>0 && cond(i, j-1)){
        k+=f(i, j-1);
    }
    if(j<DIMENTION-1 && cond(i, j+1)){
        k+=f(i, j+1);
    }
    return k;
}
//game over -- shows all bombs
function showBombs(){
    for(let i=0; i<DIMENTION; i++){
        for(let j=0; j<DIMENTION; j++){
            if(!GRIGLIA[i][j]){
                if(!isImageSet(i, j))
                    changeBgImage(i, j, BOMB_IMAGE);

            }else if(isImageSet(i, j)){
                setValue(i, j, "X");
            }
        }
    }
}
//show value of a cell
function setValue(i,j,value){
    const tile = document.getElementById(i.toString() + "-" + j.toString());
    switch(value){
        case 1:
            tile.style.color = COLORS.PURPLE;
            break;
        case 2:
            tile.style.color = COLORS.RED;
            break;
        case 3:
            tile.style.color = COLORS.GREEN;
            break;
        case 4:
            tile.style.color = COLORS.YELLOW;
            break;
        case 5:
            tile.style.color = COLORS.CYAN;
            break;
    }
    tile.innerHTML = value;
}
//reveal cells near an empty cell
function selectCells(i, j){
    function cond(i, j){
        return !isSelected(i, j) && GRIGLIA[i][j] && !isImageSet(i,j);
    }
    applyNear(selectNearVoid, i, j, cond);
}
function selectNearVoid(i, j){
    changeColor(i, j, SELECTED);
    const value = GRIGLIA[i][j];
    if(value != -1)
        setValue(i,j,value);
    else
        selectCells(i, j);
}
//left-click on already selected cell
function inspectNear(i, j){
    if(countAny(i, j, isImageSet) >= GRIGLIA[i][j])
        applyNear(reveal, i, j, (i, j)=>(!isImageSet(i, j) && !isSelected(i, j)));
}
//change background color of a cell
function changeColor(i, j, color){
    let tile =  document.getElementById(i.toString() + "-" + j.toString());
    if(tile.style.backgroundColor)
        return;
    if(color == SELECTED){
        undiscovered--;
        if(undiscovered == 0)
            winGame();
    }
    tile.style.backgroundColor = color;
    tile.style.border = "1px inset lightgray";
}
//change background image
function changeBgImage(i, j, image){
    document.getElementById(i.toString() + "-" + j.toString()).style.backgroundImage = image;
}
//count near cells with condition
function countAny(i, j, cond){
    let k = 0;
    if(i>0){
        if(cond(i-1, j))
            k++;
        if(j>0 && cond(i-1, j-1))
            k++;
        if(j<DIMENTION-1 && cond(i-1, j+1))
            k++;
    }
    if(i<DIMENTION-1){
        if(cond(i+1, j))
            k++;
        if(j>0 && cond(i+1, j-1))
            k++;
        if(j<DIMENTION-1 && cond(i+1, j+1))
            k++;
    }
    if(j>0 && cond(i, j-1)){
        k++;
    }
    if(j<DIMENTION-1 && cond(i, j+1)){
        k++;
    }
    return k==0?-1:k;
}
//win state
function winGame(){
    state++;
    document.getElementById("state").innerHTML = "Congrats, you won!";
}
//retry
function newGame(){
    state = 0;
    document.getElementById("state").innerHTML = "Left-click board<br> to start the game.";
    for(let i=0; i<DIMENTION; i++){
        for(let j=0;j<DIMENTION;j++){
            GRIGLIA[i][j] = 1;
            const tile = document.getElementById(i.toString() + "-" + j.toString());
            tile.style.backgroundColor = "";
            tile.style.backgroundImage = "";
            tile.style.borderStyle = "outset";
            tile.innerHTML = "";
        }
    }
    bombNum=0;
    document.getElementById("timer").innerHTML = "00:00";
    document.getElementById("bombs").innerHTML = "000";
}
//timer
function showTime(date){
    if(state!=1)
        return;
    let tmp = Math.floor(date/100);
    let m = Math.floor((tmp/60))%60;
    let s = tmp%60;
    m = (m < 10) ? "0" + m : m;
    s = (s < 10) ? "0" + s : s;
    let time = m + ":" + s;
    let timer = document.getElementById("timer");
    if(timer.innerHTML != time)
        timer.innerText = time;
    setTimeout(showTime, 100, date+10);
}
//bomb counter
function setCounter(n){
    while(n.toString().length <3){
        n = "0"+n;
    }
    document.getElementById("bombs").innerHTML = n;
}
//tutorial menu
function tutorial() {
    var popup = document.getElementById("tutorial");
    popup.classList.toggle("visible");
}
//ausiliar functions
function isImageSet(i, j){
    return document.getElementById(i.toString() + "-" + j.toString()).style.backgroundImage;
}
function isNotHoleNear(i, j){
    return !(applyNear((i,j)=>(1),i,j,(i,j)=>(GRIGLIA[i][j]==-1))>0);
}
function isSelected(i, j){
    return document.getElementById(i.toString() + "-" + j.toString()).style.backgroundColor;
}
function alreadyIn(arr, i, j){
    for(let o of arr){
        if(o[0] == i && o[1] == j)
            return true;
    }
    return false;
}
//onload
window.onload = function(){
    initialize();
}