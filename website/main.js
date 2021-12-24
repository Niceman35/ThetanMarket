let provider;
let signer;
const WBNBAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const WBNBAbi = [
    "function balanceOf(address) public view returns (uint256)",
    "function deposit() public payable",
    "function withdraw(uint) public",
    // An event triggered whenever anyone transfers to someone else
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];
let WBNBContract;
const MarkAddress = "0x54ac76f9afe0764e6a8Ed6c4179730E6c768F01C";
const MarkAbi = [
    "function usedSignatures(bytes) public view returns (bool)",
    "function matchTransaction(address[3], uint256[3], bytes) external returns (bool)",
    // An event triggered whenever anyone transfers to someone else
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];
let MarkContract;
const NFTAddress = "0x98eb46CbF76B19824105DfBCfa80EA8ED020c6f4";
const NFTAbi = [
    "function balanceOf(address) public view returns (uint256)",
    "function ownerOf(uint256) public view returns (address)",
    "function isLocked(uint256) public view returns (bool)",
    // An event triggered whenever anyone transfers to someone else
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];
let NFTContract;

let Filters = {
    'sort' : 'PriceAsc',
};
let myAddress = '';
let thcPrice = 0;
let bnbPrice = 0;
document.addEventListener("DOMContentLoaded", function(event) {
    document.addEventListener("click",function(b){function n(a,e){a.className=a.className.replace(u,"")+e}function p(a){return a.getAttribute("data-sort")||a.innerText}var u=/ dir-(u|d) /,c=/\bsortable\b/;b=b.target;if("TH"===b.nodeName)try{var q=b.parentNode,f=q.parentNode.parentNode;if(c.test(f.className)){var g,d=q.cells;for(c=0;c<d.length;c++)d[c]===b?g=c:n(d[c],"");d=" dir-d ";-1!==b.className.indexOf(" dir-d ")&&(d=" dir-u ");n(b,d);var h=f.tBodies[0],k=[].slice.call(h.rows,0),r=" dir-u "===d;k.sort(function(a, e){var l=p((r?a:e).cells[g]),m=p((r?e:a).cells[g]);return isNaN(l-m)?l.localeCompare(m):l-m});for(var t=h.cloneNode();k.length;)t.appendChild(k.splice(0,1)[0]);f.replaceChild(t,h)}}catch(a){}});
    if (typeof window.ethereum !== "undefined") {
        provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        provider.on("network", (newNetwork, oldNetwork) => {
            if (oldNetwork) {
                window.location.reload();
            }
        });
        window.ethereum.autoRefreshOnNetworkChange = false;
        MarkContract = new ethers.Contract(MarkAddress, MarkAbi, provider);
        WBNBContract = new ethers.Contract(WBNBAddress, WBNBAbi, provider);
        NFTContract = new ethers.Contract(NFTAddress, NFTAbi, provider);
        signer = provider.getSigner();
        try {
            signer.getAddress().then((result) => {
                myAddress = result;
                console.log('Address: '+myAddress);
                document.getElementById('myAddress').innerHTML = myAddress;
                WBNBContract.balanceOf(myAddress).then(balance => {
                    document.getElementById('myWBNB').innerHTML = ethers.utils.formatEther(balance);
                });
                provider.getBalance(myAddress).then( balance => {
                    document.getElementById('myBNB').innerHTML = ethers.utils.formatEther(balance);
                });
                NFTContract.balanceOf(myAddress).then(balance => {
                    document.getElementById('HeroesNum').innerHTML = parseInt(balance);
                });
                window.ethereum.on('accountsChanged', function (accounts) {
                    window.location.reload();
                });
                provider.getNetwork().then(chainId => {
                    if(chainId.chainId !== 56) {
                        document.getElementById('webConnect').innerHTML = 'Switch to Binance Smart Chain';
//                        alert("Connect wallet to the Binance Smart chain");
                    } else {
                        document.getElementById('divConnect').style.display = 'none';
                    }
                });


            });
        } catch (e) {
            console.log(e);
        }
    } else {
        document.getElementById('webConnect').disabled = false;
        alert('Not found Web3 compatible Ethereum wallet.');
    }
    document.getElementById('Barrier').value = localStorage['barrier'];
    document.getElementById('Barrier').addEventListener('change', async function () {
        console.log('Barrier changed');
        let barrier = (document.getElementById('Barrier').value).replace(/'/g,"");
        let status = await loadAccStats(barrier);
        if(status) {
            alert('Token saved sucessfully');
            localStorage.setItem('barrier', barrier);
            document.getElementById('Barrier').style.backgroundColor = 'lightgreen';
        }
    });
    document.getElementById('webConnect').addEventListener('click', ConnectBinance);
    document.getElementById('updateButton').addEventListener('click', loadHeroMarket);
    document.getElementById('bWrap').addEventListener('click', wrapBNB);
    document.getElementById('bUWrap').addEventListener('click', unWrapBNB);
    document.getElementById('autoStart').addEventListener('click', updateSwitch);
    document.getElementById('FiltersDiv').addEventListener('click', heroFilters);

    fetch('https://data.thetanarena.com/thetan/v1/hero/feConfigs?configVer=-1')
        .then(response => response.json())
        .then(data => {
            let heroesRarity = [0,0,0,1,0,0,0,1,0,0,2,1,2,2,1,0,1,1,1,2,1,2,2,0,0];

            let heroDiv = document.getElementById('heroes');
            for (var id in data["data"]["configs"]) {
                if (!data["data"]["configs"].hasOwnProperty(id)) continue;
                let item = data["data"]["configs"][id];
                let div = document.createElement('div');
                div.style.backgroundImage = "url('https://assets.thetanarena.com/" + item['imgSmallDefaultIcon']+"')";
                div.title = item['name'];
                div.id = 'heroId_' +id;
                div.dataset['rare'] = heroesRarity[id];
                div.dataset['role'] = item['role'];
                heroDiv.appendChild(div);
            }
            let div = document.createElement('div');
            div.innerHTML = 'Latest\nitems';
            div.title = 'Load latest items for all heroes';
            div.id = 'heroId_1000';
            heroDiv.appendChild(div);
        });
    fetch('https://exchange.thetanarena.com/exchange/v1/currency/price/1')
        .then(response => response.json())
        .then(data => {thcPrice = data['data'];document.getElementById('THC').innerHTML = thcPrice;if(!thcPrice) alert('Error: Can not load THC price!');});
    fetch('https://exchange.thetanarena.com/exchange/v1/currency/price/32')
        .then(response => response.json())
        .then(data => {bnbPrice = data['data'];document.getElementById('WBNB').innerHTML = bnbPrice;if(!bnbPrice) alert('Error: Can not load WBNB price!');});
    if(localStorage['barrier'] > '') {
        loadAccStats(localStorage['barrier']);
    }
});

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
            document.getElementById('myWBNB').innerHTML = ethers.utils.formatEther(await WBNBContract.balanceOf(myAddress));
            document.getElementById('myBNB').innerHTML  = ethers.utils.formatEther(await provider.getBalance(myAddress));
            document.getElementById('HeroesNum').innerHTML = await NFTContract.balanceOf(myAddress);
            window.ethereum.on('accountsChanged', function (accounts) {
                window.location.reload();
            });
            document.getElementById('divConnect').style.display = 'none';
            document.getElementById('myAddress').innerHTML = myAddress;

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
    let fRarity = [].filter.call(document.forms['filtersForm'].elements['FHeroRarity[]'], (c) => c.checked).map(c => c.value);
    let fRole = [].filter.call(document.forms['filtersForm'].elements['FRole[]'], (c) => c.checked).map(c => c.value);
    let fSkins = [].filter.call(document.forms['filtersForm'].elements['FSkinRarity[]'], (c) => c.checked).map(c => c.value);

    if(event.target.name === 'FHeroRarity[]' || event.target.name === 'FRole[]') {
        let herosDivs = document.getElementById('heroes').childNodes;
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
        let herosDivs = document.getElementById('heroes').childNodes;
        if(event.target.id === 'heroId_1000') {
            for (let i = 0; i < herosDivs.length; i++) {
                herosDivs[i].className = '';
            }
            document.getElementById('heroId_1000').className = 'selected';
        } else {
            event.target.classList.toggle('selected');
            document.getElementById('heroId_1000').className = '';
        }
    }

    let selectedH = [].filter.call(document.getElementById('heroes').childNodes, (c) => (c.className === 'selected')).map(c => c.id.substring(7));

    Filters['heroTypeIds'] = selectedH.join('%2C');
    if(fSkins.length > 0)
        Filters['skinRarity'] = fSkins.join('%2C');
    else
        delete Filters['skinRarity'];
}

async function loadAccStats(barrier) {
    let responce = await fetch("https://data.thetanarena.com/thetan/v1/profile",
        {
            method: 'GET',
            withCredentials: true,
            headers: new Headers({
                'Authorization': 'Bearer ' + barrier,
                'Content-Type': 'application/json'
            })
        });
    let data = await responce.json();
    if(data['success']) {
        document.getElementById('accStats').style.display = 'block';
        document.getElementById('accUsername').innerHTML = data['data']['username'];
        document.getElementById('accBattles').innerHTML = data['data']['playerStatistic']['battle'];
        document.getElementById('accWins').innerHTML = data['data']['playerStatistic']['victory'];
        document.getElementById('accWinRate').innerHTML = (data['data']['playerStatistic']['victory'] / data['data']['playerStatistic']['battle'] * 100).toFixed(0);
        return true;
    } else {
        alert('Wrong Auth Token provided');
        localStorage.setItem('barrier','');
        document.getElementById('Barrier').value = '';
        return false;
    }
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
    let lastFilters = document.getElementById('FiltersDiv').dataset['curhero'];
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
    let searchURL = getSearchURL();
    console.log(searchURL);
    let load = document.getElementById('Load').value;
    if(Filters['heroTypeIds'] === '1000') load = 50;
    for(let i = 0; i <= Math.floor(load/51); i++) {
        let loadURL = searchURL + '&from=' + i * 50 + '&size=50';
        // if (heroIDs === '1000')
        //     loadURL = 'https://data.thetanarena.com/thetan/v1/nif/search?sort=Latest&battleMin=' + gamesLeft + '&from=0&size=50';
        let responce = await fetch(loadURL);
        let data = await responce.json();
        if(!data["data"])
            break;
        data["data"].forEach(function (item) {
            let LevelBonus = {
                0: [0, 0.006, 0.01, 0.01, 0.02],
                1: [0, 0.117, 0.20, 0.27, 0.35],
                2: [0, 0.750, 1.25, 1.75, 2.25, 2.75]
            };
            let reward = 9.25;
            if(item.heroRarity === 1) {
                reward = 12.5;
            }
            if(item.heroRarity === 2) {
                reward = 29.55;
            }
            reward += LevelBonus[item.heroRarity][Math.floor((item.level-1)/2)];
            let winRate = parseInt(document.getElementById('WinRate').value)/100;
            let loseRate = 1 - winRate;
            let USDPrice = (item.price / 100000000 * bnbPrice);
            let profit = ((item.battleCap * loseRate * 1 + item.battleCap * winRate * reward) * thcPrice) - USDPrice;
            let percent = Math.round((profit / USDPrice) * 100);
            if(!localStorage[item.id]) {
                markettext.push({
                    'name': item.name,
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
                    'id': item.id
                });
            }
        });
        document.getElementById('MintStatus').innerHTML = 'Load page: ' +i;
        if(data["data"].length < 50)
            break;
    }
//        markettext.sort((a, b) => parseFloat(b.profit) - parseFloat(a.profit));
    markettext.sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent));

    createTable(markettext);
}

function createTable(markettext) {
    document.getElementById('MintStatus').innerHTML = 'Updated';
    let marketDiv = document.getElementById('marketData');
    if(markettext.length === 0) {
        marketDiv.innerHTML = '<BR><DIV>Nothing found</DIV><BR>';
        return;
    }
    marketDiv.innerHTML = '';
    let HeroR = ['Common', 'Epic', 'Legendary'];
    let SkinR = ['Normal', 'Rare', 'Mythical'];
    let trophy = ['0','H','G','F','E','D','C','B','A','S','SS'];
    let headers = ["Name (Skin)", "Left/Max/Used", "Price BNB", "Price $", "$/Battle", "Profit $", "ROI %", 'Link', 'Check'];
    let table = document.createElement("TABLE");  //makes a table element for the page
    table.className = 'marketTable sortable';
    table.addEventListener('click', checkHero);
    let heroSwitched = false;
    if(Object.keys(lastFound).length === 0) {
        heroSwitched = true;
    }
    for(let i = 0; i < markettext.length; i++) {
        let row = table.insertRow(i);
        let percentUsed = (markettext[i].battlesMax - markettext[i].battles)*100/markettext[i].battlesMax;
        let colorUsed = '';
        if(percentUsed < 10) colorUsed = '" style="color:green';
        if(percentUsed > 70) colorUsed = '" style="color:red';
        if(!heroSwitched && !lastFound[markettext[i].id]) {
            row.style.backgroundColor = 'lightgreen';
        }
        row.insertCell(0).innerHTML = '<span title="'+ HeroR[markettext[i].heroR] +'" class="'+ HeroR[markettext[i].heroR] +'">'+ markettext[i].name +'</span> (<span title="'+SkinR[markettext[i].skinR]+'" class="'+ SkinR[markettext[i].skinR] +'">'+ markettext[i].skin +'</span>) ['+ markettext[i].level +'] ('+ trophy[markettext[i].trophy] +')';
        row.insertCell(1).outerHTML = '<TD data-sort="'+ markettext[i].battles + colorUsed +'"><B>'+ markettext[i].battles +'</B>&nbsp;/&nbsp;'+ markettext[i].battlesMax +'&nbsp;/&nbsp;'+ (markettext[i].battlesMax - markettext[i].battles) +'&nbsp;('+ percentUsed.toFixed(0) +'%)</TD>';
        row.insertCell(2).innerHTML = (markettext[i].price).toFixed(4);
        row.insertCell(3).innerHTML = (markettext[i].price*bnbPrice).toFixed(2);
        row.insertCell(4).innerHTML = ((markettext[i].price*bnbPrice)/markettext[i].battles).toFixed(2);
        row.insertCell(5).innerHTML = '<B>' + (markettext[i].profit).toFixed(2) + '</B>';
        row.insertCell(6).innerHTML = (markettext[i].percent).toFixed(0);
        row.insertCell(7).innerHTML = '<A href="https://marketplace.thetanarena.com/item/' + markettext[i].refID + '" target="_blank">Market link</A>';
        row.insertCell(8).innerHTML = '<BUTTON data-status = "check" id="'+markettext[i].id+'">Check</BUTTON>';
        lastFound[markettext[i].id] = true;
    }

    let header = table.createTHead();
    let headerRow = header.insertRow(0);
    for(let i = 0; i < headers.length; i++) {
        headerRow.insertCell(i).outerHTML = '<TH>' + headers[i] + '</TH>';
    }

    marketDiv.appendChild(table);
}

async function checkHero(event) {
    let heroID = event.target.id;
    if(event.target.dataset['status'] === 'buy') {
        buyHero(heroID, event.target.dataset['sign'], event.target.dataset['owner']);
        return;
    }
    if(event.target.dataset['status'] === 'ignore') {
        localStorage.setItem(heroID, true);
        event.currentTarget.deleteRow(event.target.parentElement.parentElement.rowIndex);
        return;
    }
    if(event.target.dataset['status'] !== 'check')
        return;
    let responce = await fetch('https://data.thetanarena.com/thetan/v1/items/'+heroID+'?id='+heroID);
    let data = await responce.json();
//        console.log(data);
    console.log('TokenID: ' + data['data'].tokenId);
    if(!localStorage['barrier']) {
        alert('You need to add the Auth Token to check the hero automatically');
        setIgnore(event.target, 'No Auth token');
        return;
    }
    if(data["data"]["sale"]) {
        let marketOwner = data["data"].ownerAddress;
        let responce = await fetch("https://data.thetanarena.com/thetan/v1/items/" + heroID + "/signed-signature?id=" + heroID,
            {
                method: 'GET',
                withCredentials: true,
                headers: new Headers({
                    'Authorization': 'Bearer '+localStorage['barrier'],
                    'Content-Type': 'application/json'
                })
            }
        );
        let signed = await responce.json();
        console.log('Sign: ' + signed['data']);
        if(!signed['data']) {
            alert('Wrong AuthToken or can not connect to the market');
            setIgnore(event.target, 'Wrong Auth token');
            return;
        }
        let criteriaMessageHash = getMessageHash(
            data['data'].nftContract,
            data['data'].tokenId,
            data['data']['sale']['paymentToken'].contractAddress,
            data['data']['sale'].price + '0000000000',
            data['data'].saltNonce
        );
        console.log('Crit: ' + criteriaMessageHash);
        let recovered = '';
        if(parseInt(signed['data'].substr(-2),16) > 26) {
            recovered =  ethers.utils.verifyMessage(ethers.utils.arrayify(criteriaMessageHash), signed['data']);
            console.log('Recover seller: ' + recovered);
        }
        if(recovered.toLowerCase() === marketOwner) {
            if(myAddress > '') {
                let chainId = await provider.getNetwork();
                if(chainId.chainId !== 56) {
                    alert("Connect wallet to the Binance Smart chain to check a hero");
                    return;
                }
                let isLocked = await NFTContract.isLocked(data['data'].tokenId);
                if(!isLocked) {
                    let NFTowner = await NFTContract.ownerOf(data['data'].tokenId);
                    console.log('NFT owner: ' + NFTowner);
                    if (NFTowner.toLowerCase() === marketOwner) {
                        let used = await MarkContract.usedSignatures(signed['data']);
                        if (!used) {
                            event.target.style.backgroundColor = 'lawngreen';
                            event.target.dataset['sign'] = signed['data'];
                            event.target.dataset['owner'] = recovered;
                            event.target.dataset['status'] = 'buy';
                            event.target.innerHTML = 'BUY';
                        } else {
                            setIgnore(event.target, 'Bought/cancelled already');
                            console.log('Used signature');
                        }
                    } else {
                        setIgnore(event.target, 'Bought already');
                        console.log('Not NFT owner');
                    }
                } else {
                    setIgnore(event.target, 'NFT is locked');
                    console.log('NFT is locked');
                }
            } else {
                alert('Connect with Web3 wallet to quick BUY the hero');
                event.target.style.backgroundColor = 'lawngreen';
                event.target.dataset['status'] = 'ok';
                event.target.innerHTML = 'Ok';
            }
        } else {
            setIgnore(event.target, 'Wrong signature');
            console.log('Wrong signature');
        }
    } else {
        setIgnore(event.target, 'Not for sale');
        console.log('Not for sale');
    }
}

function setIgnore(div, reason) {
    div.style.backgroundColor = 'orangered';
    div.title = reason;
    div.dataset['status'] = 'ignore';
    div.innerHTML = 'Ignore';
}

async function buyHero(heroID, signature, owner) {
    let chainId = await provider.getNetwork();
    if(chainId.chainId !== 56) {
        alert("Connect wallet to the Binance Smart chain");
        return;
    }
    let responce = await fetch('https://data.thetanarena.com/thetan/v1/items/'+heroID+'?id='+heroID);
    let data = await responce.json();
    if(parseFloat(document.getElementById('myWBNB').innerHTML) < data['data']['sale']['price']/100000000) {
        alert("No enoght WBNB balance.");
        return;
    }
    let info = data['data'];
    const MarkWithSigner = MarkContract.connect(signer);
    try {
        const tx = await MarkWithSigner.matchTransaction([owner, info['nftContract'], "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"], [info.tokenId, info['sale'].price + '0000000000', info.saltNonce], signature, { gasPrice: 10000000000 });

        const receipt = await tx.wait();
        console.log(receipt);
        if(receipt.status === 1) {
            document.getElementById('MintStatus').innerHTML = '<B>Bought sucessfully!</B>';
        }
    } catch (e) {
        document.getElementById('MintStatus').innerHTML = '<I>Error: '+e.message+'</I>';
    }
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
    let chainId = await provider.getNetwork();
    if(chainId.chainId !== 56) {
        alert("Connect wallet to the Binance Smart chain");
        return;
    }
    const WBNBWithSigner = WBNBContract.connect(signer);
    let amount = ethers.utils.parseEther(document.getElementById('wrapAmount').value);
    try {
        const tx = await WBNBWithSigner.deposit({value: amount});

        const receipt = await tx.wait();
        console.log(receipt);
        if(receipt.status === 1) {
            document.getElementById('MintStatus').innerHTML = '<B>Wrapped sucessfully!</B>';
            document.getElementById('myWBNB').innerHTML = ethers.utils.formatEther(await WBNBContract.balanceOf(myAddress));
            document.getElementById('myBNB').innerHTML  = ethers.utils.formatEther(await provider.getBalance(myAddress));
        }
    } catch (e) {
        document.getElementById('MintStatus').innerHTML = '<I>Error: '+e.message+'</I>';
    }

}

async function unWrapBNB() {
    let chainId = await provider.getNetwork();
    if(chainId.chainId !== 56) {
        alert("Connect wallet to the Binance Smart chain");
        return;
    }
    const WBNBWithSigner = WBNBContract.connect(signer);
    let amount = ethers.utils.parseEther(document.getElementById('wrapAmount').value);
    try {
        const tx = await WBNBWithSigner.withdraw(amount);

        const receipt = await tx.wait();
        console.log(receipt);
        if(receipt.status === 1) {
            document.getElementById('MintStatus').innerHTML = '<B>UnWrapped sucessfully!</B>';
            document.getElementById('myWBNB').innerHTML = ethers.utils.formatEther(await WBNBContract.balanceOf(myAddress));
            document.getElementById('myBNB').innerHTML  = ethers.utils.formatEther(await provider.getBalance(myAddress));
        }
    } catch (e) {
        document.getElementById('MintStatus').innerHTML = '<I>Error: '+e.message+'</I>';
    }

}

function getMessageHash(_nftAddress, _tokenId, _paymentErc20, _price, _saltNonce) {
    return ethers.utils.solidityKeccak256(['address', 'uint256', 'address', 'uint256', 'uint256'], [ _nftAddress, _tokenId, _paymentErc20, _price, _saltNonce ]);
}
