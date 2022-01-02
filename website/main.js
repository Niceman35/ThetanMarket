let provider;
let signer;
const WBNBAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const WBNBAbi = [
    "function balanceOf(address) public view returns (uint256)",
    "function deposit() public payable",
    "function withdraw(uint) public",
];
let WBNBContract;
const MarkAddress = "0x54ac76f9afe0764e6a8Ed6c4179730E6c768F01C";
const MarkAbi = [
    "function usedSignatures(bytes) public view returns (bool)",
    "function matchTransaction(address[3], uint256[3], bytes) external returns (bool)",
];
let MarkContract;
const NFTAddress = "0x98eb46CbF76B19824105DfBCfa80EA8ED020c6f4";
const NFTAbi = [
    "function balanceOf(address) public view returns (uint256)",
    "function ownerOf(uint256) public view returns (address)",
    "function isLocked(uint256) public view returns (bool)",
];
let NFTContract;
let MarkWithSigner;

let Filters = {
    'sort' : 'PPB',
};
let myAddress = '';
let thcPrice = 0;
let bnbPrice = 0;
const BoughtSound = new Audio("/bought.mp3");
document.addEventListener("DOMContentLoaded", async function(event) {
    document.getElementById('marketData').addEventListener("click",function(b){function n(a,e){a.className=a.className.replace(u,"")+e}function p(a){return a.getAttribute("data-sort")||a.innerText}var u=/ dir-(u|d) /,c=/\bsortable\b/;b=b.target;if("TH"===b.nodeName)try{var q=b.parentNode,f=q.parentNode.parentNode;if(c.test(f.className)){var g,d=q.cells;for(c=0;c<d.length;c++)d[c]===b?g=c:n(d[c],"");d=" dir-d ";-1!==b.className.indexOf(" dir-d ")&&(d=" dir-u ");n(b,d);var h=f.tBodies[0],k=[].slice.call(h.rows,0),r=" dir-u "===d;k.sort(function(a, e){var l=p((r?a:e).cells[g]),m=p((r?e:a).cells[g]);return isNaN(l-m)?l.localeCompare(m):l-m});for(var t=h.cloneNode();k.length;)t.appendChild(k.splice(0,1)[0]);f.replaceChild(t,h)}}catch(a){}});

    if (typeof window.ethereum !== "undefined") {
        provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        MarkContract = new ethers.Contract(MarkAddress, MarkAbi, provider);
        WBNBContract = new ethers.Contract(WBNBAddress, WBNBAbi, provider);
        NFTContract = new ethers.Contract(NFTAddress, NFTAbi, provider);
        provider.on("network", (newNetwork, oldNetwork) => {
            if (oldNetwork) {
                window.location.reload();
            }
        });
        window.ethereum.autoRefreshOnNetworkChange = false;
        signer = provider.getSigner();
        try {
            signer.getAddress().then((result) => {
                myAddress = result;
                MarkWithSigner = MarkContract.connect(signer);
                console.log('Address: '+myAddress);
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
            alert('Can not connect to the  Web3 compatible wallet.');
        }
    } else {
        document.getElementById('webConnect').disabled = false;
        alert('Not found Web3 compatible wallet.');
    }

    document.getElementById('Barrier').value = localStorage['Bearer'];
    document.getElementById('Barrier').addEventListener('change', async function () {
        console.log('Barrier changed');
        let barrier = (document.getElementById('Barrier').value).replace(/'/g,"");
        localStorage.setItem('Bearer', barrier);
        let status = await loadAccStats();
        if(status) {
            document.getElementById('Barrier').style.backgroundColor = 'lightgreen';
            alert('Token saved sucessfully');
        }
    });

    document.getElementById('webConnect').addEventListener('click', ConnectBinance);
    document.getElementById('updateButton').addEventListener('click', loadHeroMarket);
    document.getElementById('bWrap').addEventListener('click', wrapBNB);
    document.getElementById('bUWrap').addEventListener('click', unWrapBNB);
    document.getElementById('autoStart').addEventListener('click', updateSwitch);
    document.getElementById('FiltersDiv').addEventListener('click', heroFilters);
    document.getElementById('saveStats').addEventListener('click', function () {
        const battles = document.getElementById('accBattles').innerHTML;
        const accWins = document.getElementById('accWins').innerHTML;
        localStorage['SavedStats'] = battles +'|'+ accWins;
    });
    setInterval(updateUserData, 5*60*1000); // 5 min

    fetch('https://data.thetanarena.com/thetan/v1/hero/feConfigs?configVer=-1')
        .then(response => response.json())
        .then(data => {
            const heroesRarity = [0,0,0,1,0,0,0,1,0,0,2,1,2,2,1,0,1,1,1,2,1,2,2,0,0];

            const heroDiv = document.getElementById('heroes');
            for (var id in data["data"]["configs"]) {
                if (!data["data"]["configs"].hasOwnProperty(id)) continue;
                const item = data["data"]["configs"][id];
                const div = document.createElement('div');
                div.style.backgroundImage = "url('https://assets.thetanarena.com/" + item['imgSmallDefaultIcon']+"')";
                div.title = item['name'];
                div.id = 'heroId_' +id;
                div.dataset['rare'] = heroesRarity[id];
                div.dataset['role'] = item['role'];
                heroDiv.appendChild(div);
            }
            const div = document.createElement('div');
            div.innerHTML = 'Latest\nitems';
            div.title = 'Load latest items for all heroes';
            div.id = 'heroId_1000';
            heroDiv.appendChild(div);
        });

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
        const response = await fetch("https://data.thetanarena.com/thetan/v1/profile",
            {
                method: 'GET',
                withCredentials: true,
                headers: new Headers({
                    'Authorization': 'Bearer ' + localStorage['Bearer'],
                    'Content-Type': 'application/json'
                })
            });
        const answer = await response.json();
        if (answer['success']) {
            const battles = parseInt(answer['data']['playerStatistic']['battle']);
            const wins = parseInt(answer['data']['playerStatistic']['victory']);
            document.getElementById('accStats').style.display = 'block';
            document.getElementById('accUsername').innerHTML = answer['data']['username'];
            document.getElementById('accBattles').innerHTML = battles;
            document.getElementById('accWins').innerHTML = wins;
            document.getElementById('accWinRate').innerHTML = (wins / battles * 100).toFixed(0);
            if(localStorage['SavedStats'] > '') {
                const SavedData = localStorage['SavedStats'].split('|');
                document.getElementById('accBattlesSave').innerHTML = battles - SavedData[0];
                document.getElementById('accWinsSave').innerHTML = wins - SavedData[1];
                document.getElementById('accWinRateSave').innerHTML = ((wins - SavedData[1]) / (battles - SavedData[0]) * 100).toFixed(0);
            }
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
    const chainsData = {
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
        const chainId = await provider.getNetwork();
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
            updateBallances();
            document.getElementById('divConnect').style.display = 'none';
        } catch (e) {
            document.getElementById('webConnect').disabled = false;
            alert("Can not connect to Web3 wallet (MetaMask)");
        }
    } else {
        document.getElementById('webConnect').disabled = false;
        alert('Not found Web3 compatible Ethereum wallet.');
    }
}

function heroFilters(event) {
    const fRarity = [].filter.call(document.forms['filtersForm'].elements['FHeroRarity[]'], (c) => c.checked).map(c => c.value);
    const fRole = [].filter.call(document.forms['filtersForm'].elements['FRole[]'], (c) => c.checked).map(c => c.value);
    const fSkins = [].filter.call(document.forms['filtersForm'].elements['FSkinRarity[]'], (c) => c.checked).map(c => c.value);

    if(event.target.name === 'FHeroRarity[]' || event.target.name === 'FRole[]') {
        const herosDivs = document.getElementById('heroes').childNodes;
        for (let i = 0; i < herosDivs.length; i++) {
            let selected = 0;
            if (fRarity.length && fRole.length) {
                if (fRarity.includes(herosDivs[i].dataset['rare']) && fRole.includes(herosDivs[i].dataset['role']))
                    selected = 1;
            } else {
                if (fRarity.includes(herosDivs[i].dataset['rare']))
                    selected = 1;
                if (fRole.includes(herosDivs[i].dataset['role']))
                    selected = 1;
            }
            if (selected) {
                herosDivs[i].className = 'selected';
                herosDivs[i].style.display = 'block';
            } else {
                herosDivs[i].className = '';
                if (fRarity.length || fRole.length)
                    herosDivs[i].style.display = 'none';
                else
                    herosDivs[i].style.display = 'block';
            }
        }
    }

    if(event.target.parentElement.id === 'heroes') {
        const herosDivs = document.getElementById('heroes').childNodes;
        if(event.target.id === 'heroId_1000' || event.ctrlKey) {
            for (let i = 0; i < herosDivs.length; i++) {
                herosDivs[i].className = '';
            }
            document.getElementById(event.target.id).className = 'selected';
        } else {
            event.target.classList.toggle('selected');
            document.getElementById('heroId_1000').className = '';
        }
    }

    const selectedH = [].filter.call(document.getElementById('heroes').childNodes, (c) => (c.className === 'selected')).map(c => c.id.substring(7));

    Filters['heroTypeIds'] = selectedH.join('%2C');
    if(fSkins.length > 0)
        Filters['skinRarity'] = fSkins.join('%2C');
    else
        delete Filters['skinRarity'];

    if (event.ctrlKey) loadHeroMarket();
}

let lastFound = {};

function getSearchURL() {
    if(document.getElementById('fLevelMin').value > 1)
        Filters['levelMin'] = document.getElementById('fLevelMin').value;
    else
        delete Filters['levelMin'];

    if(document.getElementById('fTrophyMin').value > 1)
        Filters['trophyMin'] = document.getElementById('fTrophyMin').value;
    else
        delete Filters['trophyMin'];

    if(document.getElementById('fBatPercentMin').value > 0)
        Filters['batPercentMin'] = document.getElementById('fBatPercentMin').value;
    else
        delete Filters['batPercentMin'];
    Filters['battleMin'] = document.getElementById('fBattleMin').value;

    let newFilters = [];
    for(let fName in Filters) {
        newFilters.push(fName + '=' + Filters[fName]);
    }
    newFilters = newFilters.join('&');

    if (Filters['heroTypeIds'] === '1000') {
        newFilters = 'sort=Latest&battleMin='+ Filters['battleMin'] +'&batPercentMin='+ document.getElementById('fBatPercentMin').value;
    }
    const lastFilters = document.getElementById('FiltersDiv').dataset['curhero'];
    if(lastFilters && newFilters !== lastFilters) {
        lastFound = {};
    }
    document.getElementById('FiltersDiv').dataset['curhero'] = newFilters;

    return 'https://data.thetanarena.com/thetan/v1/nif/search?' + newFilters;
}

async function loadHeroMarket(event) {
    if(Filters['heroTypeIds'] === '') {
        alert('Choose a hero(es).');
        return;
    }
    document.getElementById('MintStatus').innerHTML = '<span>Loading...</span>';
    autoSecondsLeft = document.getElementById('autoDelay').value*1;
    let markettext = [];
    const searchURL = getSearchURL();

    let load = document.getElementById('Load').value;
    let size = 50;
    if(Filters['heroTypeIds'] === '1000') {
        load = 20;
        size = 20;
    }
    let requests = [];
    for(let i = 0; i <= Math.floor(load/51); i++) {
        requests.push(fetch(searchURL + '&from=' + i * 50 + '&size=' + size));
    }
    const responses  = await Promise.all(requests);
    const datas = await Promise.all(responses.map(r => r.json()));

    for(let i = 0; i < datas.length; i++) {
        const data = datas[i];
        if(data["data"] == null)
            continue;
        let LevelBonus = {
            0: [0, 0.006, 0.01, 0.01, 0.02],
            1: [0, 0.117, 0.20, 0.27, 0.35],
            2: [0, 0.750, 1.25, 1.75, 2.25, 2.75]
        };
        let lowerWallet = myAddress.toLowerCase();
        data["data"].forEach(function (item) {
            let reward = 9.25;
            if(item.heroRarity === 1) {
                reward = 12.5;
            }
            if(item.heroRarity === 2) {
                reward = 29.55;
            }
            reward += LevelBonus[item.heroRarity][Math.floor((item.level-1)/2)];
            const winRate = parseInt(document.getElementById('WinRate').value)/100;
            const loseRate = 1 - winRate;
            const USDPrice = (item.price / 100000000 * bnbPrice);
            const profit = ((item.battleCap * loseRate * 1 + item.battleCap * winRate * reward) * thcPrice) - USDPrice;
            const percent = Math.round((profit / USDPrice) * 100);
            let owner = 0;
            if(item.ownerAddress === lowerWallet)
                owner = 1;
            if(!localStorage[item.id]) {
                markettext.push({
                    'name': item.name,
                    'nameid': item.heroTypeId,
                    'skin': item.skinName,
                    'level': item.level,
                    'trophy': item.trophyClass,
                    'price': item.price / 100000000,
                    'profit': profit,
                    'percent': percent,
                    'refID': item.refId,
                    'battles': item.battleCap,
                    'battlesMax': item.battleCapMax,
                    'heroR': item.heroRarity,
                    'skinR': item.skinRarity,
                    'id': item.id,
                    'owner' : owner
                });
            }
        });
        document.getElementById('MintStatus').innerHTML = 'Load page: ' +i;
    }
    markettext.sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent));
    createTable(markettext);
}

function createTable(markettext) {
    document.getElementById('MintStatus').innerHTML = 'Updated';
    const marketDiv = document.getElementById('marketData');
    if(markettext.length === 0) {
        marketDiv.innerHTML = '<BR><DIV>Nothing found</DIV><BR>';
        return;
    }
    marketDiv.innerHTML = '';
    const HeroR = ['Common', 'Epic', 'Legendary'];
    const SkinR = ['Normal', 'Rare', 'Mythical'];
    const trophy = ['0','H','G','F','E','D','C','B','A','S','SS'];
    const headers = ["Name (Skin)", "Left/Max/Used", "Price BNB", "Price $", "$/Battle", "Profit $", "ROI %", 'Link', 'Check'];

    if(!Filters['heroTypeIds'].includes('%2C') && Filters['heroTypeIds'] !== '1000') {
        const iteminfo = markettext[3];
        const PPB = Math.round(iteminfo.price * 100000000 / iteminfo.battles);
        localStorage.setItem("rPrice_" + iteminfo.nameid, PPB + '_' + Date.now());
        document.getElementById('MintStatus').innerHTML = 'Saved an average price for the <B>'+ iteminfo.name +'</B>. Set to '+ (PPB/100000000).toFixed(6) +' BNB/B, <B>'+ (PPB*bnbPrice/100000000).toFixed(3) +'</B> USD/B';
    }

    let table = document.createElement("TABLE");  //makes a table element for the page
    table.className = 'marketTable sortable';
    table.id = 'HeroesTable';
    table.addEventListener('click', checkHero);
    let heroSwitched = false;
    if(Object.keys(lastFound).length === 0) {
        heroSwitched = true;
    }
    for(let i = 0; i < markettext.length; i++) {
        let row = table.insertRow(i);
        const percentUsed = (markettext[i].battlesMax - markettext[i].battles)*100/markettext[i].battlesMax;
        let colorUsed = '';
        if(percentUsed < 10) colorUsed = '" style="color:green';
        if(percentUsed > 70) colorUsed = '" style="color:red';
        let profitRatio = 0;
        if(!heroSwitched && !lastFound[markettext[i].id]) {
            row.style.backgroundColor = 'lightgreen';
        }
        if(markettext[i].owner) {
            row.style.backgroundColor = 'burlywood';
        }
        if(localStorage['rPrice_' + markettext[i].nameid]) {
            const avgPrice = localStorage['rPrice_' + markettext[i].nameid].split('_');
            if (Date.now() < avgPrice[1] + 60 * 60 * 2) {
                const thisPrice = Math.round(markettext[i].price * 100000000 / markettext[i].battles);
                profitRatio = avgPrice[0] / thisPrice;
                if (profitRatio > 1.05) {
                    console.log(thisPrice + ' ' + avgPrice[0] + ' ' + profitRatio);
                    row.style.backgroundColor = '#f8d218';
                    if (profitRatio > 1.1) {
                        row.style.backgroundColor = "#bdf610";
                    }
                }
            }
        }
        row.insertCell(0).innerHTML = '<span title="'+ HeroR[markettext[i].heroR] +'" class="'+ HeroR[markettext[i].heroR] +'">'+ markettext[i].name +'</span> (<span title="'+SkinR[markettext[i].skinR]+'" class="'+ SkinR[markettext[i].skinR] +'">'+ markettext[i].skin +'</span>) ['+ markettext[i].level +'] ('+ trophy[markettext[i].trophy] +')';
        row.insertCell(1).outerHTML = '<TD data-sort="'+ markettext[i].battles + colorUsed +'"><B>'+ markettext[i].battles +'</B>&nbsp;/&nbsp;'+ markettext[i].battlesMax +'&nbsp;/&nbsp;'+ (markettext[i].battlesMax - markettext[i].battles) +'&nbsp;('+ percentUsed.toFixed(0) +'%)</TD>';
        row.insertCell(2).innerHTML = (markettext[i].price).toFixed(3);
        row.insertCell(3).innerHTML = (markettext[i].price*bnbPrice).toFixed(2);
        row.insertCell(4).outerHTML = '<TD title="'+ (markettext[i].price/markettext[i].battles).toFixed(6) +' WBNB">'+ ((markettext[i].price*bnbPrice)/markettext[i].battles).toFixed(2) +'</TD>';
        row.insertCell(5).innerHTML = '<B>' + (markettext[i].profit).toFixed(2) + '</B>';
        row.insertCell(6).outerHTML = '<TD title="'+ (profitRatio*100).toFixed(0) +'%">'+ (markettext[i].percent).toFixed(0) +'</TD>';
        row.insertCell(7).innerHTML = '<A href="https://marketplace.thetanarena.com/item/' + markettext[i].refID + '" target="_blank">Market link</A>';
        if(!markettext[i].owner) {
            row.insertCell(8).innerHTML = '<BUTTON data-status = "check" id="' + markettext[i].id + '">Check</BUTTON>';
        }
        lastFound[markettext[i].id] = true;
    }

    const header = table.createTHead();
    const headerRow = header.insertRow(0);
    for(let i = 0; i < headers.length; i++) {
        headerRow.insertCell(i).outerHTML = '<TH>' + headers[i] + '</TH>';
    }
    marketDiv.appendChild(table);
}

async function checkHero(event) {
    const heroID = event.target.id;
    if(event.target.dataset['status'] === 'buy') {
        buyHero(heroID, event.target.dataset['sign']);
        return;
    }
    if(event.target.dataset['status'] === 'ignore') {
        localStorage.setItem(heroID, true);
        event.currentTarget.deleteRow(event.target.parentElement.parentElement.rowIndex);
        return;
    }
    if(event.target.dataset['status'] !== 'check')
        return;

    document.getElementById('autoStart').style.backgroundColor = null;
    document.getElementById('autoStart').dataset['status'] = 'start';
    document.getElementById('autoStart').value = 'START';
    document.getElementById('autoLeft').innerHTML = '';
    clearInterval(updateInterval);
    clearInterval(leftInterval);
    event.target.innerHTML = "⏳";
    event.target.disabled = true;

    if(!localStorage['Bearer']) {
        alert('You need to add the Auth Token to check the hero automatically, or check manually on the market');
        setIgnore(event.target, 'No Auth token');
        return;
    }
    if(myAddress === '') {
        alert('You need connect you Wallet to Check and Buy the hero');
        setIgnore(event.target, 'No Auth token');
        return;
    }
    const response = await getHeroInfoWithSignature(heroID);
    if(typeof response[1] === "string") {
        alert('Wrong AuthToken or can not connect to the market');
        setIgnore(event.target, 'Wrong Auth token');
        return;
    }

    if(response[1]["data"] != null) {
        const signature = response[1]["data"];
        const info = response[0]['data'];
        console.log('TokenID: ' + info.tokenId);
        console.log('Sign: ' + signature);
        try {
            if(parseInt(signature.substr(-2),16) < 26)
                throw 'Wrong signature';
            const gasCost = await MarkWithSigner.estimateGas.matchTransaction([info['ownerAddress'], info['nftContract'], "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"], [info.tokenId, info['sale'].price + '0000000000', info.saltNonce], signature);
            console.log(gasCost.toString());
            event.target.disabled = false;
            event.target.style.backgroundColor = 'lawngreen';
            event.target.dataset['sign'] = signature;
            event.target.dataset['status'] = 'buy';
            event.target.innerHTML = 'BUY';
        } catch (error) {
            let errMsg;
            if(error['data'])
                errMsg = error['data']['message'];
            else
                errMsg = error.toString();
//            console.log(errMsg);
            let message = 'Wrong signature';
            if (errMsg.includes('transfer locked token'))
                message = 'Locked token';
            if (errMsg.includes('signature used') || errMsg.includes('seller is not owner'))
                message = 'Sold already';
            if (errMsg.includes('have enough token')) {
                let isLocked = await NFTContract.isLocked(info.tokenId);
                if(isLocked) {
                    setIgnore(event.target, 'NFT is locked');
                } else {
                    event.target.disabled = false;
                    event.target.style.backgroundColor = 'lawngreen';
                    event.target.dataset['sign'] = signature;
                    event.target.dataset['status'] = 'buy';
                    event.target.innerHTML = 'BUY';
                    alert('Low WBNB Balance');
                }
            } else {
                setIgnore(event.target, message);
            }
        }
    } else {
        setIgnore(event.target, 'Sold already');
    }
}

function setIgnore(div, reason) {
    div.disabled = false;
    div.style.backgroundColor = 'orangered';
    div.title = reason;
    div.dataset['status'] = 'ignore';
    div.innerHTML = 'Ignore';
}

async function buyHero(heroID, signature) {
    let myButton = document.getElementById(heroID);
    myButton.innerHTML = "⏳";
    myButton.disabled = true;

    let response = [];
    const data = await fetch('https://data.thetanarena.com/thetan/v1/items/'+ heroID +'?id='+ heroID);
    response[0] = await data.json();
    response[1] = {'data' : signature, 'success': true};

//    console.log(response);
    if(typeof response[1] === "string") {
        alert('Wrong AuthToken or can not connect to the market');
        myButton.innerHTML = "❌";
        return;
    }

    if(response[1]['data'] != null && response[0]['data']['sale']) {
        const signature = response[1]["data"];
        const info = response[0]['data'];
        if(parseFloat(document.getElementById('myWBNB').innerHTML) < info['sale'].price / 100000000) {
            alert("No enoght WBNB balance.");
            myButton.innerHTML = "❌";
            return;
        }
        try {
            const tx = await MarkWithSigner.matchTransaction([info['ownerAddress'], info['nftContract'], "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"], [info.tokenId, info['sale'].price + '0000000000', info.saltNonce], signature, { gasPrice: 6000000000 });
            const receipt = await tx.wait();
            console.log(receipt);
            if(receipt.status === 1) {
                myButton.innerHTML = "✔";
                document.getElementById('MintStatus').innerHTML = '<B>Bought sucessfully!</B>';
                BoughtSound.play();
                updateUserData();
            }
        } catch (e) {
            let message = 'Error while executing transaction.';
            if(e['data'])
                message = e['data'].message;
            document.getElementById('MintStatus').innerHTML = '<I>Error: '+message+'</I>';
            myButton.innerHTML = "❌";
        }

    }
}

async function getHeroInfoWithSignature(heroID) {
    const data  = await Promise.all([
        fetch('https://data.thetanarena.com/thetan/v1/items/'+ heroID +'?id='+ heroID),
        fetch("https://data.thetanarena.com/thetan/v1/items/"+ heroID +"/signed-signature?id="+ heroID,
            {
                method: 'GET',
                withCredentials: true,
                headers: new Headers({
                    'Authorization': 'Bearer ' + localStorage['Bearer'],
                    'Content-Type': 'application/json'
                })
            })
    ]);
    return response = await Promise.all(data.map(r => r.json()));
}

let updateInterval;
let leftInterval;
let autoSecondsLeft = 100;
function updateSwitch(event) {
    if(Filters['heroTypeIds'] === '') {
        alert('Choose a hero(es).');
        return;
    }
    if(document.getElementById('autoStart').dataset['status'] === 'start') {
        document.getElementById('autoStart').style.backgroundColor = 'green';
        document.getElementById('autoStart').dataset['status'] = 'stop';
        document.getElementById('autoStart').value = 'STOP';
        updateInterval = setInterval(loadHeroMarket, document.getElementById('autoDelay').value * 1000);
        leftInterval = setInterval(countLeft, 1000);
        autoSecondsLeft = document.getElementById('autoDelay').value*1;
    }
    else if(document.getElementById('autoStart').dataset['status'] === 'stop') {
        document.getElementById('autoStart').style.backgroundColor = null;
        document.getElementById('autoStart').dataset['status'] = 'start';
        document.getElementById('autoStart').value = 'START';
        document.getElementById('autoLeft').innerHTML = '';
        clearInterval(updateInterval);
        clearInterval(leftInterval);
    }
}

function countLeft() {
    document.getElementById('autoLeft').innerHTML = autoSecondsLeft--;
}

async function wrapBNB() {
    const myButton = document.getElementById('bWrap');
    myButton.innerHTML = "⏳";
    myButton.disabled = true;

    const WBNBWithSigner = WBNBContract.connect(signer);
    const amount = ethers.utils.parseEther(document.getElementById('wrapAmount').value);
    try {
        const tx = await WBNBWithSigner.deposit({value: amount});
        const receipt = await tx.wait();
        console.log(receipt);
        if(receipt.status === 1) {
            myButton.innerHTML = "Wrap &gt;";
            myButton.disabled = false;
            document.getElementById('MintStatus').innerHTML = '<B>Wrapped sucessfully!</B>';
            document.getElementById('myWBNB').innerHTML = ethers.utils.formatEther(await WBNBContract.balanceOf(myAddress));
            document.getElementById('myBNB').innerHTML  = ethers.utils.formatEther(await provider.getBalance(myAddress));
        }
    } catch (e) {
        document.getElementById('MintStatus').innerHTML = '<I>Error: '+e.message+'</I>';
        myButton.innerHTML = "Wrap &gt;";
        myButton.disabled = false;
    }

}

async function unWrapBNB() {
    let myButton = document.getElementById('bUWrap');
    myButton.innerHTML = "⏳";
    myButton.disabled = true;

    const WBNBWithSigner = WBNBContract.connect(signer);
    let amount = ethers.utils.parseEther(document.getElementById('wrapAmount').value);
    try {
        const tx = await WBNBWithSigner.withdraw(amount);

        const receipt = await tx.wait();
        console.log(receipt);
        if(receipt.status === 1) {
            myButton.innerHTML = "&lt; UnWrap";
            myButton.disabled = false;
            document.getElementById('MintStatus').innerHTML = '<B>UnWrapped sucessfully!</B>';
            document.getElementById('myWBNB').innerHTML = ethers.utils.formatEther(await WBNBContract.balanceOf(myAddress));
            document.getElementById('myBNB').innerHTML  = ethers.utils.formatEther(await provider.getBalance(myAddress));
        }
    } catch (e) {
        document.getElementById('MintStatus').innerHTML = '<I>Error: '+e.message+'</I>';
        myButton.innerHTML = "Wrap &gt;";
        myButton.disabled = false;
    }

}
