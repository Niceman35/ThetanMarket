let thcPrice = 0;
let bnbPrice = 0;
let provider;
let signer;
let myAddress = '';
const WBNBAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const WBNBAbi = [
    "function balanceOf(address) public view returns (uint256)",
    "function deposit() public payable",
    "function withdraw(uint) public",
];
let WBNBContract;
const NFTAddress = "0x98eb46CbF76B19824105DfBCfa80EA8ED020c6f4";
const NFTAbi = [
    "function balanceOf(address) public view returns (uint256)",
    "function ownerOf(uint256) public view returns (address)",
    "function isLocked(uint256) public view returns (bool)",
];
let NFTContract;


document.addEventListener("DOMContentLoaded", async function(event) {
    document.addEventListener("click",function(b){function n(a,e){a.className=a.className.replace(u,"")+e}function p(a){return a.getAttribute("data-sort")||a.innerText}var u=/ dir-(u|d) /,c=/\bsortable\b/;b=b.target;if("TH"===b.nodeName)try{var q=b.parentNode,f=q.parentNode.parentNode;if(c.test(f.className)){var g,d=q.cells;for(c=0;c<d.length;c++)d[c]===b?g=c:n(d[c],"");d=" dir-d ";-1!==b.className.indexOf(" dir-d ")&&(d=" dir-u ");n(b,d);var h=f.tBodies[0],k=[].slice.call(h.rows,0),r=" dir-u "===d;k.sort(function(a, e){var l=p((r?a:e).cells[g]),m=p((r?e:a).cells[g]);return isNaN(l-m)?l.localeCompare(m):l-m});for(var t=h.cloneNode();k.length;)t.appendChild(k.splice(0,1)[0]);f.replaceChild(t,h)}}catch(a){}});

    if (typeof window.ethereum !== "undefined") {
        provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        provider.on("network", (newNetwork, oldNetwork) => {
            if (oldNetwork) {
                window.location.reload();
            }
        });
        window.ethereum.autoRefreshOnNetworkChange = false;
        WBNBContract = new ethers.Contract(WBNBAddress, WBNBAbi, provider);
        NFTContract = new ethers.Contract(NFTAddress, NFTAbi, provider);
        signer = provider.getSigner();
        try {
            signer.getAddress().then((result) => {
                myAddress = result;
                window.ethereum.on('accountsChanged', function (accounts) {
                    window.location.reload();
                });
                provider.getNetwork().then(chainId => {
                    if(chainId.chainId !== 56) {
                        document.getElementById('webConnect').innerHTML = 'Switch to Binance Smart Chain';
                    } else {
                        document.getElementById('divConnect').style.display = 'none';
                    }
                });
                updateUserData();
            });
        } catch (e) {
            console.log(e);
            alert('Can not connect to the Web3 wallet.');
        }
    } else {
        document.getElementById('webConnect').disabled = false;
        alert('Not found Web3 compatible wallet.');
    }

    document.getElementById('Barrier').value = localStorage['Bearer'];
    document.getElementById('webConnect').addEventListener('click', ConnectBinance);
    document.getElementById('WinRate').addEventListener('change', loadHeroes);
    document.getElementById('updateButton').addEventListener('click', loadHeroes);
    document.getElementById('historyButton').addEventListener('click', loadHistory);
    document.getElementById('Barrier').addEventListener('change', async function () {
        console.log('Barrier changed');
        let barrier = (document.getElementById('Barrier').value).replace(/'/g,"");
        let status = await loadAccStats();
        if(status) {
            alert('Token saved sucessfully');
            localStorage.setItem('Bearer', barrier);
            document.getElementById('Barrier').style.backgroundColor = 'lightgreen';
        }
    });
    if(localStorage['Bearer']) {
        loadHeroes();
    }
    setInterval(updateUserData, 5*60*1000); // 5 min
});

async function updateUserData() {
    document.getElementById('myAddress').innerHTML = myAddress;
    provider.getBalance(myAddress).then((answer) => document.getElementById('myBNB').innerHTML = ethers.utils.formatEther(answer));
    WBNBContract.balanceOf(myAddress).then((answer) => document.getElementById('myWBNB').innerHTML = ethers.utils.formatEther(answer));
    NFTContract.balanceOf(myAddress).then((answer) => document.getElementById('HeroesNum').innerHTML = answer);
    fetch('https://exchange.thetanarena.com/exchange/v1/currency/price/1')
        .then(response => response.json())
        .then(answer => {thcPrice = answer['data'];document.getElementById('THC').innerHTML = thcPrice;if(!thcPrice) alert('Error: Can not load THC price!');});
    fetch('https://exchange.thetanarena.com/exchange/v1/currency/price/32')
        .then(response => response.json())
        .then(answer => {bnbPrice = answer['data'];document.getElementById('WBNB').innerHTML = bnbPrice;if(!bnbPrice) alert('Error: Can not load WBNB price!');});
    await loadAccStats();
}

async function loadAccStats() {
    if(localStorage['Bearer'] > '') {
        let response = await fetch("https://data.thetanarena.com/thetan/v1/profile",
            {
                method: 'GET',
                withCredentials: true,
                headers: new Headers({
                    'Authorization': 'Bearer ' + localStorage['Bearer'],
                    'Content-Type': 'application/json'
                })
            });
        let answer = await response.json();
        if (answer['success']) {
            document.getElementById('accStats').style.display = 'block';
            document.getElementById('accUsername').innerHTML = answer['data']['username'];
            document.getElementById('accBattles').innerHTML = answer['data']['playerStatistic']['battle'];
            document.getElementById('accWins').innerHTML = answer['data']['playerStatistic']['victory'];
            document.getElementById('accWinRate').innerHTML = (answer['data']['playerStatistic']['victory'] / answer['data']['playerStatistic']['battle'] * 100).toFixed(0);
            return true;
        } else {
            alert('Wrong Auth Token provided');
            localStorage.setItem('Bearer', '');
            document.getElementById('Barrier').value = '';
            return false;
        }
    } else {
        return false;
    }
}

async function ConnectBinance() {
    let chainsData = {
        chainId: '0x38',
        chainName: "Binance Smart Chain Mainnet",
        nativeCurrency: {
            name: "BNB",
            symbol: "BNB",
            decimals: 18
        },
        rpcUrls: ["https://bsc-dataseed1.binance.org"],
        blockExplorerUrls: ["https://bscscan.com"]
    };
    if (typeof window.ethereum !== "undefined") {
        document.getElementById('webConnect').disabled = true;
        let chainId = await provider.getNetwork();
        if(chainId.chainId !== 56) {
            try {
                await provider.send('wallet_switchEthereumChain',
                    [{ chainId: '0x38' }]
                );
            } catch (switchError) {
                if(typeof switchError === "string") {
                    alert('Your wallet do not support network switch. Switch network manually if possible.');
                    return;
                }
                await provider.send('wallet_addEthereumChain',
                    [chainsData]
                );
            }
        }
        try {
            myAddress = await provider.send("eth_requestAccounts", []);
            myAddress = myAddress[0];
            window.ethereum.on('accountsChanged', function (accounts) {
                window.location.reload();
            });
            document.getElementById('divConnect').style.display = 'none';
            document.getElementById('myAddress').innerHTML = myAddress;
            updateUserData();
        } catch (e) {
            document.getElementById('webConnect').disabled = false;
            alert("Can not connect to Web3 wallet (MetaMask)");
        }
    } else {
        document.getElementById('webConnect').disabled = false;
        alert('Not found Web3 compatible Ethereum wallet.');
    }
}

let skinsData = {};
async function loadHeroes() {
    let object = document.getElementById('updateButton');
    object.innerHTML = "⏳";
    object.disabled = true;

    let responce = await fetch("https://data.thetanarena.com/thetan/v1/hero/user?from=0&size=50&market=true&skinVer=-1",
        {
            method: 'GET',
            withCredentials: true,
            headers: new Headers({
                'Authorization': 'Bearer ' + localStorage['Bearer'],
                'Content-Type': 'application/json'
            })
        });
    let data = await responce.json();
    let skinsInfo = data['data']['skinConfigs']['skinConfigs'];
    skinsInfo.forEach(skin => {
        skinsData[skin.id] = skin.name;
    });
    createTable(data['data']['heroes']);
    loadAccStats();
    object.innerHTML = 'Load/Update Inventory';
    object.disabled = false;
}

function createTable(markettext) {
    let marketDiv = document.getElementById('marketData');
    if(markettext.length === 0) {
        marketDiv.innerHTML = '<BR><DIV>Nothing found</DIV><BR>';
        return;
    }
    marketDiv.innerHTML = '';
    let HeroR = ['Common', 'Epic', 'Legendary'];
    let SkinR = ['Normal', 'Rare', 'Mythical'];
    let trophy = ['0','H','G','F','E','D','C','B','A','S','SS'];
    let headers = ["Name (Skin)", "Left/Max/Used", "Buy price BNB", "$/Battle", "Earn $", "ROI %", 'Updated', 'Link', 'Price BNB', 'After fees', '$/Battle', 'SELL/REMOVE'];
    let table = document.createElement("TABLE");  //makes a table element for the page
    table.className = 'marketTable sortable';
    table.id = 'InventoryTable';
    let winRate = parseInt(document.getElementById('WinRate').value)/100;
    let loseRate = 1 - winRate;
    let LevelBonus = {
        0: [0, 0.006, 0.01, 0.01, 0.02],
        1: [0, 0.117, 0.20, 0.27, 0.35],
        2: [0, 0.750, 1.25, 1.75, 2.25, 2.75]
    };
    let totalBNB = 0;
    let rows = 0;
    for(let i = 0; i < markettext.length; i++) {
        let hRank = markettext[i].heroRanking;
        let reward = 9.25;
        if(markettext[i].rarity === 1)
            reward = 12.5;
        if(markettext[i].rarity === 2)
            reward = 29.55;
        reward += LevelBonus[markettext[i].rarity][Math.floor((markettext[i].level-1)/2)];

        let row = table.insertRow(i);
        let battles = hRank.totalBattleCapTHC - hRank.battleCapTHC;
        let percentUsed = (hRank.totalBattleCapTHC - battles)*100 / hRank.totalBattleCapTHC;
        let colorUsed = '';
        if(percentUsed < 10) colorUsed = '" style="color:green';
        if(percentUsed > 70) colorUsed = '" style="color:red';
        let BNBPrice = 0;
        if(markettext[i].lastPrice)
            BNBPrice = (markettext[i].lastPrice.value)/100000000;

        let skinName = '<span title="'+ HeroR[markettext[i].rarity] +'" class="'+ HeroR[markettext[i].rarity] +'">'+ markettext[i].heroInfo.name +'</span> (<span title="'+SkinR[markettext[i].skinRarity]+'" class="'+ SkinR[markettext[i].skinRarity] +'">'+ skinsData[markettext[i].skinId] +'</span>) ['+ markettext[i].level +'] ('+ trophy[hRank.trophyClass] +')';
        localStorage['token_'+markettext[i].tokenId] = JSON.stringify({
            id: markettext[i].id,
            name: skinName,
            buyPrice: BNBPrice
        });

        totalBNB += BNBPrice;
        let USDPrice = BNBPrice*bnbPrice;
        let profit = (battles * loseRate * 1 + battles * winRate * reward) * thcPrice;
        let percent = Math.round((profit / USDPrice) * 100);
        if(markettext[i].sale && markettext[i].sale.price.value) {
            row.style.backgroundColor = 'burlywood';
        }
        let sellPrice = 0;
        let sellFeePrice = 0;
        let sellPricePb = 0;
        if(localStorage['rPrice_' + markettext[i].heroTypeId]) {
            let avgPrice = localStorage['rPrice_' + markettext[i].heroTypeId].split('_');
            if (Date.now() < avgPrice[1] + 60 * 60 * 8) {
                sellPrice = (avgPrice[0] / 100000000 * battles).toFixed(3);
                sellFeePrice = (sellPrice * 0.9585).toFixed(4);
                sellPricePb = (avgPrice[0] / 100000000 * bnbPrice).toFixed(2);
            }
        }
        let timeAgo = (Date.now() - Date.parse(markettext[i].lastModified)) / 60000;
        let secAgo = Math.round(timeAgo);
        if(timeAgo <=60 )
            timeAgo = timeAgo.toFixed(0) + ' min';
        else  {
            timeAgo /= 60;
            timeAgo = timeAgo.toFixed(0) + ' hours';
        }

        row.insertCell(0).innerHTML = skinName;
        row.insertCell(1).outerHTML = '<TD data-sort="'+ battles + colorUsed +'"><B>'+ battles +'</B>&nbsp;/&nbsp;'+ hRank.totalBattleCapTHC +'&nbsp;/&nbsp;'+ (hRank.totalBattleCapTHC - battles) +'&nbsp;('+ percentUsed.toFixed(0) +'%)</TD>';
        row.insertCell(2).outerHTML = '<TD title="$'+ (USDPrice).toFixed(2) +'">'+ (BNBPrice).toFixed(4) +'</TD>';
        row.insertCell(3).innerHTML = ((USDPrice)/battles).toFixed(2);
        row.insertCell(4).innerHTML = (profit).toFixed(2);
        row.insertCell(5).innerHTML = (percent).toFixed(0);
        row.insertCell(6).outerHTML = '<TD data-sort="'+ secAgo +'">'+ timeAgo +'</TD>';
        row.insertCell(7).innerHTML = '<A href="https://marketplace.thetanarena.com/item/' + markettext[i].id + '" target="_blank">Market</A>';
        if(markettext[i].sale && markettext[i].sale.price.value) {
            let sellingPrice = markettext[i].sale.price.value / 100000000;
            row.insertCell(8).outerHTML = '<TD title="'+sellPrice+'">'+ (sellingPrice).toFixed(3) +' WBNB</TD>';
            row.insertCell(9).outerHTML = '<TD title="'+sellFeePrice+'">'+ (sellingPrice*0.9585).toFixed(4) +' WBNB</TD>';
            row.insertCell(10).outerHTML = '<TD title="'+sellPricePb+'">'+ (sellingPrice * bnbPrice/battles).toFixed(2) +' USD</TD>';
            row.insertCell(11).innerHTML = '<BUTTON data-nftid="'+ markettext[i].nftId +'" onClick={stopSell(this)} >STOP SELLING</BUTTON>';
        } else {
            row.insertCell(8).innerHTML = '<input class="sellPrice" type="number" step="0.001" name="saleP[]" value="'+ sellPrice +'" oninput="setSellPrice(this);" style="width: 50px">';
            row.insertCell(9).innerHTML = '<input type="number" step="0.0001" name="salePF[]" value="'+ sellFeePrice +'" oninput="setSellPrice(this);" style="width: 58px">';
            row.insertCell(10).innerHTML = '<input type="number" step="0.01" data-battles="'+ battles +'" name="USDpB[]" value="'+ sellPricePb +'" oninput="setSellPrice(this);" style="width: 45px">';
            row.insertCell(11).innerHTML = '<BUTTON data-nftid="'+ markettext[i].nftId +'" onClick={Sell(this)} >SELL</BUTTON>';
        }
        rows++;
    }
    let row = table.insertRow(rows);
    row.insertCell(0).innerHTML = '';
    row.insertCell(1).innerHTML = '';
    row.insertCell(2).innerHTML = (totalBNB).toFixed(4);
    row.insertCell(3).innerHTML = (totalBNB * bnbPrice).toFixed(2);
    row.insertCell(4).innerHTML = '';
    row.insertCell(5).innerHTML = '';
    row.insertCell(6).innerHTML = '';

    let header = table.createTHead();
    let headerRow = header.insertRow(0);
    for(let i = 0; i < headers.length; i++) {
        headerRow.insertCell(i).outerHTML = '<TH>' + headers[i] + '</TH>';
    }

    marketDiv.appendChild(table);
}

async function loadHistory() {
    let object = document.getElementById('historyButton');
    object.innerHTML = "⏳";
    object.disabled = true;

    let trans = {};
    let responce = await fetch("https://deep-index.moralis.io/api/v2/"+ myAddress +"/erc20/transfers?chain=bsc&limit=50",
        {
            method: 'GET',
            withCredentials: true,
            headers: new Headers({
                'X-API-Key' : 'zww74uICQcR7UnlqJEbcGAYTmVf9f1dPnHAhWbfoSy0qLWgW6aWjMRtE4huOS1O7',
                'Content-Type': 'application/json'
            })
        });
    let JSONanswer = await responce.json();
    JSONanswer['result'].forEach(info => {
        if(info['address'] === '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c') {
            if (!trans[info['transaction_hash']]) trans[info['transaction_hash']] = {};
            trans[info['transaction_hash']]['time'] = (Date.now() - Date.parse(info.block_timestamp)) / 1000;
            if (info['to_address'] === myAddress.toLowerCase()) {
                trans[info['transaction_hash']].in = parseFloat(ethers.utils.formatEther(info['value']));
            }
            if (info['from_address'] === myAddress.toLowerCase()) {
                if (trans[info['transaction_hash']].out)
                    trans[info['transaction_hash']].out += parseFloat(ethers.utils.formatEther(info['value']));
                else
                    trans[info['transaction_hash']].out = parseFloat(ethers.utils.formatEther(info['value']));
            }
        }
    });

    responce = await fetch("https://deep-index.moralis.io/api/v2/"+ myAddress +"/nft/transfers?chain=bsc&format=decimal&direction=both&limit=50",
        {
            method: 'GET',
            withCredentials: true,
            headers: new Headers({
                'X-API-Key' : 'zww74uICQcR7UnlqJEbcGAYTmVf9f1dPnHAhWbfoSy0qLWgW6aWjMRtE4huOS1O7',
                'Content-Type': 'application/json'
            })
        });
    JSONanswer = await responce.json();
    JSONanswer['result'].forEach(info => {
        if(trans[info['transaction_hash']] && info['token_address'] === '0x98eb46cbf76b19824105dfbcfa80ea8ed020c6f4') {
            if (info['to_address'] === myAddress.toLowerCase()) {
                trans[info['transaction_hash']].NFT = info['token_id'];
            }
            if (info['from_address'] === myAddress.toLowerCase()) {
                trans[info['transaction_hash']].NFT = info['token_id'];
            }
        }
    });
//        console.dir(trans);

    let arrtrans = [];
    for(let tranID in trans) {
        let heroInfo = {};
        if(localStorage['token_'+trans[tranID].NFT])
            heroInfo = JSON.parse(localStorage['token_'+trans[tranID].NFT]);
        let addObj = {
            tranID: tranID,
            WBNBIn: trans[tranID].in,
            WBNBOut: trans[tranID].out,
            NFT: trans[tranID].NFT,
            secAgo: trans[tranID].time
        };
        if(heroInfo.name) {
            addObj.heroName = heroInfo.name;
            addObj.heroPrice = heroInfo.buyPrice;
            addObj.heroLink = heroInfo.id;
        } else {
            addObj.heroName = '';
            addObj.heroPrice = 0;
            addObj.heroLink = '';
        }
        arrtrans.push(addObj);
    }
    arrtrans.sort((a, b) => parseFloat(b.time) - parseFloat(a.time));

    createHistoryTable(arrtrans);
    object.innerHTML = "Load/Update History";
    object.disabled = false;
}

function createHistoryTable(markettext) {
    let marketDiv = document.getElementById('historyData');
    if(markettext.length === 0) {
        marketDiv.innerHTML = '<BR><DIV>Nothing found</DIV><BR>';
        return;
    }
    marketDiv.innerHTML = '';
    let headers = ["NFT (Click to parse)", "Operation", "Transfer WBNB", "price Market", "Profit USD", "Market Link", "Time ago", "Explorer"];
    let table = document.createElement("TABLE");  //makes a table element for the page
    table.className = 'marketTable sortable';
    table.id = "HistoryTable";
    table.addEventListener('click', parseMatadata);
    for(let i = 0; i < markettext.length; i++) {
        let row = table.insertRow(i);
        let Operation = 'BUY';
        let BNBPrice = markettext[i].WBNBOut;
        if(markettext[i].WBNBIn) {
            BNBPrice = markettext[i].WBNBIn;
            Operation = '<B>SELL</B>';
        }
        let time = markettext[i].secAgo/60;
        if(time <=60 )
            time = time.toFixed(0) + ' min';
        else  {
            time /= 60;
            time = time.toFixed(0) + ' hours';
        }
        let name = markettext[i].heroName;
        if(name === '') {
            name = "<BUTTON class='parseMetadata' id='"+ markettext[i].NFT +"'>"+ markettext[i].NFT +"</BUTTON>";
        }
        let USDProfit = (BNBPrice - markettext[i].heroPrice) * bnbPrice;

        row.insertCell(0).innerHTML = name;
        row.insertCell(1).innerHTML = Operation;
        row.insertCell(2).innerHTML = (BNBPrice).toFixed(4);
        row.insertCell(3).innerHTML = (markettext[i].heroPrice).toFixed(3);
        row.insertCell(4).innerHTML = (USDProfit).toFixed(2);
        row.insertCell(5).innerHTML = (markettext[i].heroLink)? '<A href="https://marketplace.thetanarena.com/item/'+markettext[i].heroLink+'" target="_blank">Link</A>' : '';
        row.insertCell(6).innerHTML = time;
        row.insertCell(7).innerHTML = '<A href="https://bscscan.com/tx/'+markettext[i].tranID+'" target="_blank">Link</A>';
    }

    let header = table.createTHead();
    let headerRow = header.insertRow(0);
    for(let i = 0; i < headers.length; i++) {
        headerRow.insertCell(i).outerHTML = '<TH>' + headers[i] + '</TH>';
    }

    marketDiv.appendChild(table);
}

function parseMatadata(evt) {
    if(evt.target.nodeName === 'BUTTON') {
        let item = evt.target.id;
        fetch("https://data.thetanarena.com/thetan/v1/hero/tokenid/" + item)
            .then(answer => answer.json())
            .then(result => {
                let HeroR = ['Common', 'Epic', 'Legendary'];
                let SkinR = ['Normal', 'Rare', 'Mythical'];
//                    console.log(result);

                let skinName = '<span title="' + HeroR[result.rarity] + '" class="' + HeroR[result.rarity] + '">' + result.name + '</span> (<span title="' + SkinR[result.skinRarity] + '" class="' + SkinR[result.skinRarity] + '">' + result.description + '</span>)';
                let marketLink = '<A href="https://marketplace.thetanarena.com/item/' + result.id + '" target="_blank">Link</A>';

                if(evt.target.parentElement.nextElementSibling.innerHTML === 'BUY') {
                    let BuyPrice = parseFloat(evt.target.parentElement.nextElementSibling.nextElementSibling.innerHTML);
                    localStorage['token_'+item] = JSON.stringify({
                        id: result.id,
                        name:skinName,
                        buyPrice: BuyPrice
                    });
                }

                let linkTD = evt.target.parentElement.parentElement.children[4];
                evt.target.parentElement.innerHTML = skinName;
                linkTD.innerHTML = marketLink;
            });
    }
}

function setSellPrice(object) {
    if(object.name === 'saleP[]') {
        let USDpB = object.parentElement.nextElementSibling.nextElementSibling.firstElementChild;
        let PriceFeeInput = object.parentElement.nextElementSibling.firstElementChild;
        let price = object.value;
        let battles = parseInt(USDpB.dataset['battles']);
        PriceFeeInput.value = (price*0.9585).toFixed(4);
        USDpB.value = (price / battles * bnbPrice).toFixed(2);
    }
    if(object.name === 'salePF[]') {
        let USDpB = object.parentElement.nextElementSibling.firstElementChild;
        let PriceInput = object.parentElement.previousElementSibling.firstElementChild;
        let price = object.value/0.9585;
        let battles = parseInt(USDpB.dataset['battles']);
        PriceInput.value = (price).toFixed(3);
        USDpB.value = (price / battles * bnbPrice).toFixed(2);
    }
    if(object.name === 'USDpB[]') {
        let battles = parseInt(object.dataset['battles']);
        let price = battles * object.value / bnbPrice;
        let PriceFee = price*0.9585;
        object.parentElement.previousElementSibling.previousElementSibling.firstElementChild.value = price.toFixed(3);
        object.parentElement.previousElementSibling.firstElementChild.value = PriceFee.toFixed(4);
    }
}

async function stopSell(object) {
    object.innerHTML = "⏳";
    object.disabled = true;
    let nftID = object.dataset['nftid'];
    let responce = await fetch("https://data.thetanarena.com/thetan/v1/user-items/"+ nftID +"/sale",
        {
            method: 'DELETE',
            withCredentials: true,
            headers: new Headers({
                'Authorization': 'Bearer ' + localStorage['Bearer'],
                'Content-Type': 'application/json'
            })
        });
    let data = await responce.json();
    console.log(data);
    if(data.success) {
        object.style.backgroundColor = 'limegreen';
        object.innerHTML = "✔";
//            loadHeroes();
    } else {
        object.style.backgroundColor = 'orangered';
        object.innerHTML = "❌";
    }
}

async function Sell(object) {
    object.innerHTML = "⏳";
    object.disabled = true;
    let nftID = object.dataset['nftid'];
    let price = (object.parentElement.parentElement.getElementsByClassName("sellPrice")[0].value * 100000000).toFixed(0);
    let responce = await fetch("https://data.thetanarena.com/thetan/v1/user-items/"+ nftID +"/hash-message?id="+ nftID +"&paymentTokenId=61795fdb6360d68a36ecab04&SystemCurrency.Type=32&SystemCurrency.Name=WBNB&SystemCurrency.Value="+ price +"&SystemCurrency.Decimals=8",
        {
            method: 'GET',
            withCredentials: true,
            headers: new Headers({
                'Authorization': 'Bearer ' + localStorage['Bearer'],
                'Content-Type': 'application/json'
            })
        });
    let JSONanswer = await responce.json();
    console.log(JSONanswer);
    if(JSONanswer.success  === true) {
        let signature = await signer.signMessage(ethers.utils.arrayify(JSONanswer['data']));
        console.log(signature);
        let sellObj = {
            "id": nftID,
            "paymentTokenId": "61795fdb6360d68a36ecab04",
            "signedSignature": signature,
            "systemCurrency": {
                "type": 32,
                "value": price,
                "decimals": 8,
                "name": "WBNB"
            }
        };
        let responce2 = await fetch("https://data.thetanarena.com/thetan/v1/user-items/"+ nftID +"/sale",
            {
                method: 'POST',
                withCredentials: true,
                headers: new Headers({
                    'Authorization': 'Bearer ' + localStorage['Bearer'],
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(sellObj)
            });
        let answer2 = await responce2.json();
        console.log(answer2);
        if(answer2.success === true) {
            object.style.backgroundColor = 'limegreen';
            object.innerHTML = "✔";
//                loadHeroes();
        } else {
            object.style.backgroundColor = 'orangered';
            object.innerHTML = "❌";
        }
    }
}