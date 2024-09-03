function closeLandingModal(){
	document.getElementById(`landingModal`).style=`animation:fadeOut .2s forwards;`
	document.getElementById(`content`).style=`animation:fadeIn .2s;`
	console.log()
}
function uploadFile(that){
	closeLandingModal()
	var files=event.target.files
	var fileReader=new FileReader()
	fileReader.readAsText(files[0])
	fileReader.onload=function(e){
		eval(e.target.result)
		calculateAdditionalInformation()
	}
}
function calculateAdditionalInformation(stage){
	for(i1=0;i1<loans.length;i1++){
		var accountsSum=0
		for(i2=0;i2<loans[i1].accounts.length;i2++){
			var transfersSum=0
			var interestSum=0
			for(i3=0;i3<loans[i1].accounts[i2].transfers.length;i3++){
				loans[i1].accounts[i2].transfers[i3].date[1]=String(loans[i1].accounts[i2].transfers[i3].date[1]).padStart(2,`0`)
				loans[i1].accounts[i2].transfers[i3].date[2]=String(loans[i1].accounts[i2].transfers[i3].date[2]).padStart(2,`0`)
				var interest=0
				if(i3>0){
					loans[i1].accounts[i2].transfers[i3].period=Math.round((new Date(loans[i1].accounts[i2].transfers[i3].date.join(`/`))-new Date(loans[i1].accounts[i2].transfers[i3-1].date.join(`/`)))/86400000)
					if(loans[i1].accounts[i2].interestRate){
						interest=parseFloat((transfersSum*(loans[i1].accounts[i2].interestRate*(loans[i1].accounts[i2].transfers[i3].period/365))*-1).toFixed(2))
						loans[i1].accounts[i2].transfers[i3].interest=interest
					}
				}
				transfersSum+=loans[i1].accounts[i2].transfers[i3].transfer
				interestSum+=interest
			}
			loans[i1].accounts[i2].transfersSum=parseFloat(transfersSum.toFixed(2))
			loans[i1].accounts[i2].interestSum=parseFloat(interestSum.toFixed(2))
			accountsSum+=transfersSum-interestSum
		}
		loans[i1].accountsSum=parseFloat(accountsSum.toFixed(2))
	}
	sortArrays(stage)
}
function sortArrays(stage){
	loans=loans.sort(function(a,b){return a.accountsSum-b.accountsSum})
	for(i1=0;i1<loans.length;i1++){
		loans[i1].accounts=loans[i1].accounts.sort(function(a,b){return a.transfersSum-b.transfersSum})
	}
	for(i1=0;i1<assets.liquid.length;i1++){
		assets.liquid[i1].records=assets.liquid[i1].records.sort(function(a,b){return a.date.join(``)-b.date.join(``)})
	}
	for(i1=0;i1<assets.illiquid.length;i1++){
		assets.illiquid[i1].records=assets.illiquid[i1].records.sort(function(a,b){return a.date.join(``)-b.date.join(``)})
	}
	renderMenu(stage)
}
var assets={liquid:[],illiquid:[]}
var loans=[]
function renderMenu(stage){
	if(assets.liquid.length||assets.illiquid.length||loans.length){
		renderAssets()
		renderLoans(``,stage??0)
	}
}
var dateToday=new Date(`${new Date().getFullYear()}/${new Date().getMonth()+1}/${new Date().getDate()}`)
function renderAssets(){
	var contentQueue=``
	for(i1=0;i1<assets.liquid.length;i1++){
		var accountRecords=assets.liquid[i1].records
		var daysSinceUpdate=(dateToday-new Date(accountRecords[accountRecords.length-1].date.join(`/`)))/86400000
		var colour=daysSinceUpdate>0?`red`:`green`
		contentQueue+=`
			<details name="assets" style="color:${colour};">
				<summary>
					<span>${assets.liquid[i1].title}</span>
				</summary>
				<span style="color:green;">$${numberWithCommas(accountRecords[accountRecords.length-1].balance)}</span>
				<br>
				<span>updated</span> 
				${
					daysSinceUpdate>0?
					`${
						daysSinceUpdate>1?
						`${daysSinceUpdate} days ago`:
						`yesterday`
					}`:
					`today`
				}
			</details>`
	}
	document.getElementById(`assetsLiquid`).innerHTML=contentQueue
	var contentQueue=``
	for(i1=0;i1<assets.illiquid.length;i1++){
		var accountRecords=assets.illiquid[i1].records
		var daysSinceUpdate=(dateToday-new Date(accountRecords[accountRecords.length-1].date.join(`/`)))/86400000
		var colour=daysSinceUpdate>0?`red`:`green`
		contentQueue+=`
			<details name="assets" style="color:${colour};">
				<summary>
					<span>${assets.illiquid[i1].title}</span>
				</summary>
				<span style="color:green;">$${numberWithCommas(accountRecords[accountRecords.length-1].balance)}</span>
				<br>
				<span>updated</span> 
				${
					daysSinceUpdate>0?
					`${
						daysSinceUpdate>1?
						`${daysSinceUpdate} days ago`:
						`yesterday`
					}`:
					`today`
				}
			</details>`
	}
	document.getElementById(`assetsIlliquid`).innerHTML=contentQueue
	var contentQueue=``
	if(loans.length){
		var loansTotal=0
		for(i1=0;i1<loans.length;i1++){
			loansTotal+=loans[i1].accountsSum
		}
		contentQueue+=`
			<details name="assets" style="color:green;">
				<summary>
					<span>Loans</span>
				</summary>
				${
					loansTotal<0?
					`$${numberWithCommas(Math.abs(loansTotal))}`:
					`<span style="color:red;">-$${numberWithCommas(Math.abs(loansTotal))}</span>`
				}
				<br>
				<span>updated</span> automatically
			</details>`
	}
	document.getElementById(`assetsIntangible`).innerHTML=contentQueue
}
var globalCounterpartyIndex=0
var globalAccountIndex=0
var open=0
function renderLoans(isOpen,stage,counterpartyIndex,accountIndex){
	if(counterpartyIndex+1)globalCounterpartyIndex=counterpartyIndex
	if(accountIndex+1)globalAccountIndex=accountIndex
	var contentQueue=``
	if(isOpen){
		stage--
	}
	if(!stage){
		for(i1=0;i1<loans.length;i1++){
			var colour=loans[i1].accountsSum>=0?`green`:`red`
			contentQueue+=`
				<details onClick="renderLoans(this.open,1,${i1})" name="counterparty" ${open?`${i1==globalCounterpartyIndex?`open`:``}`:``} style="color:${colour};">
					<summary>
						<span>${loans[i1].counterparty}</span>
					</summary>
					${
						loans[i1].accountsSum>0?
						`$${numberWithCommas(loans[i1].accountsSum.toFixed(2))} <span>surplus</span>`:
						`${
							loans[i1].accountsSum<0?
							`$${numberWithCommas(Math.abs(loans[i1].accountsSum.toFixed(2)))} <span>outstanding</span>`:
							`settled`
						}`
					}
				</details>`
		}
		document.getElementById(`loansCounterparties`).innerHTML=contentQueue
		document.getElementById(`loansAccounts`).innerHTML=``
		document.getElementById(`loansAccountsHeader`).innerHTML=`
			<span>ACCOUNTS</span>`
		document.getElementById(`loansTransfers`).innerHTML=``
		document.getElementById(`loansTransfersHeader`).innerHTML=`
			<span>TRANSFERS</span>`
	}
	if(stage==1){
		document.getElementById(`loansAccountsHeader`).innerHTML=`
			<span>ACCOUNTS</span>
			<span onClick="createLoanEntry('accounts',${globalCounterpartyIndex})" class="button createEntry">+</span>`
		for(i1=0;i1<loans[globalCounterpartyIndex].accounts.length;i1++){
			var colour=loans[globalCounterpartyIndex].accounts[i1].transfersSum>=0?`green`:`red`
			contentQueue+=`
				<details onClick="renderLoans(this.open,2,${globalCounterpartyIndex},${i1})" name="account"
				${
					open?
					`${
						i1==globalAccountIndex?
						`open `:
						``
					}`:
					``
				}style="color:${colour};">
					<summary>
						<span>${loans[globalCounterpartyIndex].accounts[i1].title}</span>
					</summary>
					${
						loans[globalCounterpartyIndex].accounts[i1].interestRate?
						`${loans[globalCounterpartyIndex].accounts[i1].interestRate*100}% <span>interest per annum</span>
						<br>`:
						``
					}
					${
						loans[globalCounterpartyIndex].accounts[i1].transfersSum>=0?
						`${
							loans[globalCounterpartyIndex].accounts[i1].interestRate?
							`<span>principal</span> <span style="color:green">settled</span>
							<br>`:
							`$${numberWithCommas(Math.abs(loans[globalCounterpartyIndex].accounts[i1].transfersSum.toFixed(2)))} <span>principal surplus</span>
							<br>`
						}`:
						`$${numberWithCommas(Math.abs(loans[globalCounterpartyIndex].accounts[i1].transfersSum.toFixed(2)))} <span>principal outstanding</span>
						<br>`
					}
					${
						loans[globalCounterpartyIndex].accounts[i1].interestSum>0?
						`
						${
							(loans[globalCounterpartyIndex].accounts[i1].interestSum-loans[globalCounterpartyIndex].accounts[i1].transfersSum)>0?
							`<span style="color:red;">$${Math.abs(loans[globalCounterpartyIndex].accounts[i1].interestSum-loans[globalCounterpartyIndex].accounts[i1].transfersSum).toFixed(2)} outstanding</span> <span>interest</span>`:
							`${
								(loans[globalCounterpartyIndex].accounts[i1].interestSum-loans[globalCounterpartyIndex].accounts[i1].transfersSum)<0?
								`<span style="color:green;">$${Math.abs(loans[globalCounterpartyIndex].accounts[i1].interestSum-loans[globalCounterpartyIndex].accounts[i1].transfersSum).toFixed(2)} surplus</span> <span>interest</span>`:
								`<span>interest</span> <span style="color:green;">settled</span>`
							}`

						}`:
						``
					}
				</details>`
		}
		document.getElementById(`loansAccounts`).innerHTML=contentQueue
		document.getElementById(`loansTransfers`).innerHTML=``
		document.getElementById(`loansTransfersHeader`).innerHTML=`
			<span>TRANSFERS</span>`
	}else if(stage==2){
		document.getElementById(`loansTransfersHeader`).innerHTML=`
			<span>TRANSFERS</span>
			<span onClick="createLoanEntry('transfers',${globalCounterpartyIndex},${globalAccountIndex})" class="button createEntry">+</span>`
		for(i1=0;i1<loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers.length;i1++){
			var colour=loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer>=0?`green`:`red`
			contentQueue+=`
				<details style="color:${colour};">
					<summary>
						<span>${loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].date.join(`-`)}</span>
					</summary>
					${
						loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer.toFixed(2)>0?
						`+$${numberWithCommas(loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer.toFixed(2))}`:
						`-$${numberWithCommas(Math.abs(loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer).toFixed(2))}`
					}
					${
						loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].period?
						`<br>
						<span>${loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].period} days from last transfer</span>`:
						``
					}
					${
						loans[globalCounterpartyIndex].accounts[globalAccountIndex].interestRate?
						`<br>
						${
							loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].interest?
							`<span style="color:red;">$${numberWithCommas(loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].interest.toFixed(2))}</span> <span>interest accrued</span>`:
							``
						}`:
						``
					}
				</details>`
		}
		document.getElementById(`loansTransfers`).innerHTML=contentQueue
	}
	open=0
}
function changeContent(value){
	var options=document.getElementById(`trackingSections`).options
	for(i1=0;i1<options.length;i1++)document.getElementById(`content${options[i1].text}`).style=`display:none;`
	document.getElementById(`content${value}`).style=``
}
function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g,`,`);
}
var isMemoryChanged=0
function createAssetsEntry(section){
	var account=prompt(`
		Which account are you updating??\n
		(an unrecognised account title will create a new account)`)
	if(!account)return
	var date=prompt(`
		On which date are you recording a balance?\n
		(format: yyyy-mm-dd)`)
	if(!date)return
	while(!/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/.test(date)){
		alert(`You did not enter an acceptable date.`)
		date=prompt(`
			On which date are you recording a balance?\n
			(format: yyyy-mm-dd)`)
	}
	var balance=prompt(`What's the balance of the account?`)
	if(!balance)return
	while(!/^\-?[0-9]+(\.[0-9][0-9]?)?$/.test(balance)){
		alert(`You did not enter an acceptable number.`)
		var balance=prompt(`
			What's the balance of the account?\n
			(format: non-segmented numbers only)`)
	}
	var existing=0
	for(i1=0;i1<assets[section].length;i1++){
		if(account==assets[section][i1].title){
			assets[section][i1].records.push({date:[parseInt(date.split(`-`)[0]),date.split(`-`)[1],date.split(`-`)[2]],balance:parseFloat(balance)})
			existing=1
			break
		}
	}
	if(!existing)assets[section==`liquid`?`liquid`:`illiquid`].push({title:account,records:[{date:[parseInt(date.split(`-`)[0]),date.split(`-`)[1],date.split(`-`)[2]],balance:parseFloat(balance)}]})
	isMemoryChanged=1
	calculateAdditionalInformation()
}
function createLoanEntry(section,counterpartyIndex,accountIndex){
	var stage
	if(section==`counterparties`){
		stage=0
		var i2=1
		for(i1=0;i1<i2;i1++){
			var title=prompt(`Who is the counterparty to the loan?`)
			if(!title)return
			for(i3=0;i3<loans.length;i3++){
				if(loans[i3].counterparty==title){
					i2++
					alert(`That counterparty already exists.`)
				}
			}
		}
		loans.push({accounts:[],counterparty:title})
	}else if(section==`accounts`){
		stage=1
		var i2=1
		for(i1=0;i1<i2;i1++){
			var title=prompt(`What is the purpose of the loan?`)
			if(!title)return
			for(i3=0;i3<loans[counterpartyIndex].accounts.length;i3++){
				if(loans[counterpartyIndex].accounts[i3].title==title){
					i2++
					alert(`That account already exists.`)
				}
			}
		}
		loans[globalCounterpartyIndex].accounts.push({title:title,transfers:[]})
	}else if(section==`transfers`){
		stage=2
		var date=prompt(`
			When did the transfer occur?\n
			(format: yyyy-mm-dd)`)
		if(!date)return
		while(!/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/.test(date)){
			alert(`You did not enter an acceptable date.`)
			date=prompt(`
				When did the transfer occur?\n
				(format: yyyy-mm-dd)`)
		}
		var transfer=prompt(`How much money was transferred?`)
		if(!transfer)return
		while(!/^\-?[0-9]+(\.[0-9][0-9]?)?$/.test(transfer)){
			alert(`You did not enter an acceptable number.`)
			var transfer=prompt(`
				How much money was transferred?\n
				(format: non-segmented numbers only)`)
		}
		loans[counterpartyIndex].accounts[accountIndex].transfers.push({date:[parseInt(date.split(`-`)[0]),date.split(`-`)[1],date.split(`-`)[2]],transfer:parseFloat(transfer)})
		open=1
		calculateAdditionalInformation(0)
		open=1
		calculateAdditionalInformation(1)
	}
	isMemoryChanged=1
	calculateAdditionalInformation(stage)
}
window.onbeforeunload=function(){
	if(isMemoryChanged)return ``
}
function downloadMemory(){
	if(!(loans.length+assets.liquid.length+assets.illiquid.length)){
		alert(`There is no data to save.`)
		return
	}
	const arrayedDate=new Date().toISOString().replaceAll(`T`,`-`).replaceAll(`:`,`-`).split(`.`)[0].split(`-`)
	const filename=`financials(${arrayedDate[0]}y_${arrayedDate[1]}mo_${arrayedDate[2]}d_${arrayedDate[3]}h_${arrayedDate[4]}mi_${arrayedDate[5]}s).js`
	const content=`
		assets=${JSON.stringify(assets,null,`\t`)}\n
		loans=${JSON.stringify(loans,null,`\t`)}\n`
	const file=new Blob([content],{type:`text/plain`})
	const link=document.createElement(`a`)
	link.href=URL.createObjectURL(file)
	link.download=filename
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(link.href)
	isMemoryChanged=0
}