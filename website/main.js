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

let myAddress = '';
let thcPrice = 0;
let bnbPrice = 0;
document.addEventListener("DOMContentLoaded", function(event) {
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
                document.getElementById('divConnect').style.display = 'none';

            });
        } catch (e) {
            console.log(e);
        }
    } else {
        document.getElementById('webConnect').disabled = false;
        alert('Not found Web3 compatible Ethereum wallet.');
    }
    document.getElementById('Barrier').value = localStorage['barrier'];

    document.getElementById('Barrier').addEventListener('change', function () {
        console.log('Barrier changed');
        localStorage.setItem('barrier',document.getElementById('Barrier').value);
        document.getElementById('Barrier').style.backgroundColor = 'lightgreen';
    });
    document.getElementById('webConnect').addEventListener('click', ConnectEther);
    document.getElementById('heroes').addEventListener('click', loadHeroMarket);
//    document.getElementById('LoadLatest').addEventListener('click', loadHeroMarket);
    document.getElementById('bWrap').addEventListener('click', wrapBNB);
    document.getElementById('bUWrap').addEventListener('click', unWrapBNB);
    document.getElementById('autoStart').addEventListener('click', updateSwitch);

    fetch('https://data.thetanarena.com/thetan/v1/hero/feConfigs?configVer=-1')
        .then(response => response.json())
        .then(data => {
            let heroDiv = document.getElementById('heroes');
            for (var prop in data["data"]["configs"]) {
                if (!data["data"]["configs"].hasOwnProperty(prop)) continue;
                let item = data["data"]["configs"][prop];
                let div = document.createElement('div');
                div.className = 'heroDiv';
                div.style.backgroundImage = "url('https://assets.thetanarena.com/" + item['imgSmallDefaultIcon']+"')";
                div.title = item['name'];
                div.id = 'heroId_' +prop;
                heroDiv.appendChild(div);
            }
            let div = document.createElement('div');
            div.className = 'heroDiv';
            div.innerHTML = 'Latest\nitems';
            div.title = 'Load latest items for all heroes';
            div.id = 'heroId_1000';
            heroDiv.appendChild(div);
        });
    fetch('https://exchange.thetanarena.com/exchange/v1/currency/price/1')
        .then(response => response.json())
        .then(data => {thcPrice = data['data'];document.getElementById('THC').innerHTML = thcPrice;});
    fetch('https://exchange.thetanarena.com/exchange/v1/currency/price/32')
        .then(response => response.json())
        .then(data => {bnbPrice = data['data'];document.getElementById('WBNB').innerHTML = bnbPrice;});
    if(localStorage['barrier']) {
        fetch("https://data.thetanarena.com/thetan/v1/profile",
            {
                method: 'GET',
                withCredentials: true,
                headers: new Headers({
                    'Authorization': 'Bearer '+localStorage['barrier'],
                    'Content-Type': 'application/json'
                })})
            .then(response => response.json())
            .then(data => {
                if(data['success']) {
                    document.getElementById('accStats').style.display = 'block';
                    document.getElementById('accUsername').innerHTML = data['data']['username'];
                    document.getElementById('accBattles').innerHTML = data['data']['playerStatistic']['battle'];
                    document.getElementById('accWins').innerHTML = data['data']['playerStatistic']['victory'];
                    document.getElementById('accWinRate').innerHTML = (data['data']['playerStatistic']['victory'] / data['data']['playerStatistic']['battle'] * 100).toFixed(0);
                }
            });
    }

});

async function ConnectEther() {
    if (typeof window.ethereum !== "undefined") {
        document.getElementById('webConnect').disabled = true;
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
let lastFound = {};
async function loadHeroMarket(event) {
    let heroID = '';
    if(event && event.target) {
        if (event.target.id === 'heroes') return;
        heroID = event.target.id.substring(7);
    } else if(document.getElementById('heroes').dataset['curhero']) {
        heroID = document.getElementById('heroes').dataset['curhero'];
        autoSecondsLeft = document.getElementById('autoDelay').value*1;
    } else {
        return;
    }
    let lastHero = document.getElementById('heroes').dataset['curhero'];
    if(lastHero && heroID !== lastHero) {
        document.getElementById('heroId_'+lastHero).style.border = '1px solid black';
        lastFound = {};
    }
    document.getElementById('heroes').dataset['curhero'] = heroID;
    document.getElementById('heroId_'+heroID).style.border = '3px solid green';
    document.getElementById('MintStatus').innerHTML = '<span>Loading...</span>';
    let markettext = [];
    let gamesLeft = document.getElementById('GamesLeft').value;
    let load = document.getElementById('Load').value;
    if(heroID === '1000') load = 50;
    for(let i = 0; i <= Math.floor(load/51); i++) {
        let loadURL = 'https://data.thetanarena.com/thetan/v1/nif/search?sort=PriceAsc&battleMin='+gamesLeft+'&heroTypeIds='+heroID+'&from='+i*50+'&size=50';
        if(heroID === '1000')
            loadURL = 'https://data.thetanarena.com/thetan/v1/nif/search?sort=Latest&battleMin='+gamesLeft+'&from=0&size=50';
        let responce = await fetch(loadURL);
        let data = await responce.json();
            console.log(data);
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
            let profit = ((item.battleCap * loseRate + item.battleCap * winRate * reward) * thcPrice) - (item.price / 100000000 * bnbPrice);
            let percent = Math.round((profit / (item.price / 100000000 * bnbPrice))*100);
//                //if (profit > 50)
            if(!localStorage[item.id]) {
                markettext.push({
                    'name': item.name,
                    'skin': item.skinName,
                    'level': item.level,
                    'price': item.price / 100000000,
                    'profit': profit,
                    'percent': percent,
                    'refID': item.refId,
                    'battles': item.battleCap,
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
    marketDiv.innerHTML = '';
    let HeroR = ['Common', 'Epic', 'Legendary'];
    let SkinR = ['Normal', 'Rare', 'Mythical'];
    let avgBattles = [221, 360, 791];
    let headers = ["Name (Skin)", "Battles", "Price BNB", "Price USD", "Profit USD", "Profit %", 'Link', 'Check'];
    let table = document.createElement("TABLE");  //makes a table element for the page
    table.className = 'marketTable';
    table.addEventListener('click', checkHero);
    let heroSwitched = false;
    if(Object.keys(lastFound).length === 0) {
        heroSwitched = true;
    }
    for(let i = 0; i < markettext.length; i++) {
        let row = table.insertRow(i);
        if(!heroSwitched && !lastFound[markettext[i].id]) {
            row.style.backgroundColor = 'lightgreen';
        }
        row.insertCell(0).innerHTML = '<span title="'+HeroR[markettext[i].heroR]+'" class="'+HeroR[markettext[i].heroR]+'">' + markettext[i].name + '</span> (' + '<span title="'+SkinR[markettext[i].skinR]+'"class="'+SkinR[markettext[i].skinR]+'">' + markettext[i].skin + '</span>) [' + markettext[i].level + ']';
        row.insertCell(1).innerHTML = markettext[i].battles + ' (' + (markettext[i].battles * 100 / avgBattles[markettext[i].heroR]).toFixed(0) + '%)';
        row.insertCell(2).innerHTML = (markettext[i].price).toFixed(4);
        row.insertCell(3).innerHTML = '$' + (markettext[i].price*bnbPrice).toFixed(2);
        row.insertCell(4).innerHTML = '<B>$' + (markettext[i].profit).toFixed(2) + '</B>';
        row.insertCell(5).innerHTML = (markettext[i].percent).toFixed(0) + '%';
        row.insertCell(6).innerHTML = '<A href="https://marketplace.thetanarena.com/item/' + markettext[i].refID + '" target="_blank">Market link</A>';
        row.insertCell(7).innerHTML = '<BUTTON data-status = "check" id="'+markettext[i].id+'">Check</BUTTON>';
        lastFound[markettext[i].id] = true;
    }

    let header = table.createTHead();
    let headerRow = header.insertRow(0);
    for(let i = 0; i < headers.length; i++) {
        headerRow.insertCell(i).innerHTML = headers[i];
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
    let chainId = await provider.getNetwork();
    if(chainId.chainId !== 56) {
        alert("Connect wallet to the Binance Smart chain");
        return;
    }
    let responce = await fetch('https://data.thetanarena.com/thetan/v1/items/'+heroID+'?id='+heroID);
    let data = await responce.json();
//        console.log(data);
    console.log('TokenID: ' + data['data'].tokenId);
    if(!localStorage['barrier']) {
        alert('You need to add the AuthToken to check the hero');
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
                            setIgnore(event.target);
                            console.log('Used signature');
                        }
                    } else {
                        setIgnore(event.target);
                        console.log('Not NFT owner');
                    }
                } else {
                    setIgnore(event.target);
                    console.log('NFT is locked');
                }
            } else {
                alert('Connect with Web3 wallet to quick BUY the hero');
                event.target.style.backgroundColor = 'lawngreen';
                event.target.dataset['status'] = 'ok';
                event.target.innerHTML = 'Ok';
            }
        } else {
            setIgnore(event.target);
            console.log('Wrong signature');
        }
    } else {
        setIgnore(event.target);
        console.log('Not for sale');
    }
}

function setIgnore(div) {
    div.style.backgroundColor = 'orangered';
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
//        console.log(data);
//        console.log(data['data'].tokenId);
//        console.log(data['data']['sale']['price']/100000000);
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
    if(!document.getElementById('heroes').dataset['curhero']) {
        alert('Select hero first');
        return;
    }
    if(document.getElementById('autoStart').dataset['status'] === 'start') {
        document.getElementById('autoStart').style.backgroundColor = 'green';
        document.getElementById('autoStart').dataset['status'] = 'stop';
        document.getElementById('autoStart').value = 'STOP';
        updateInterval = setInterval(loadHeroMarket, document.getElementById('autoDelay').value * 1000);
        autoSecondsLeft = document.getElementById('autoDelay').value*1;
        leftInterval = setInterval(countLeft, 1000);
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