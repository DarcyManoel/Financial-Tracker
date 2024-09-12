function closeLandingModal(){
	document.getElementById(`landingModal`).style=`animation:fadeOut .2s forwards;`
	document.getElementById(`content`).style=`animation:fadeIn .2s;`
	console.log()
}
function uploadFile(that){
	closeLandingModal()
	let files=event.target.files
	const fileReader=new FileReader()
	fileReader.readAsText(files[0])
	fileReader.onload=function(e){
		eval(e.target.result)
		calculateAdditionalInformation()
	}
}
function calculateAdditionalInformation(stage){
	for(let i1=0;i1<assets.liquid.length;i1++){
		assets.liquid[i1].period=Math.round((new Date(assets.liquid[i1].records[assets.liquid[i1].records.length-1].date.join(`/`))-new Date(assets.liquid[i1].records[0].date.join(`/`)))/86400000)
		assets.liquid[i1].records[0].period=0
		let balanceAverage=assets.liquid[i1].records[0].balance
		for(let i2=1;i2<assets.liquid[i1].records.length;i2++){
			assets.liquid[i1].records[i2].period=Math.round((new Date(assets.liquid[i1].records[i2].date.join(`/`))-new Date(assets.liquid[i1].records[i2-1].date.join(`/`)))/86400000)
			balanceAverage+=assets.liquid[i1].records[i2].balance
		}
		assets.liquid[i1].balanceAverage=balanceAverage/assets.liquid[i1].records.length
	}
	for(let i1=0;i1<assets.illiquid.length;i1++){
		assets.illiquid[i1].period=Math.round((new Date(assets.illiquid[i1].records[assets.illiquid[i1].records.length-1].date.join(`/`))-new Date(assets.illiquid[i1].records[0].date.join(`/`)))/86400000)
		assets.illiquid[i1].records[0].period=0
		let balanceAverage=assets.illiquid[i1].records[0].balance
		for(let i2=1;i2<assets.illiquid[i1].records.length;i2++){
			assets.illiquid[i1].records[i2].period=Math.round((new Date(assets.illiquid[i1].records[i2].date.join(`/`))-new Date(assets.illiquid[i1].records[i2-1].date.join(`/`)))/86400000)
			balanceAverage+=assets.illiquid[i1].records[i2].balance
		}
		assets.illiquid[i1].balanceAverage=balanceAverage/assets.illiquid[i1].records.length
	}
	for(let i1=0;i1<loans.length;i1++){
		let accountsSum=0
		for(let i2=0;i2<loans[i1].accounts.length;i2++){
			let transfersSum=0
			let interestSum=0
			for(let i3=0;i3<loans[i1].accounts[i2].transfers.length;i3++){
				loans[i1].accounts[i2].transfers[i3].date[1]=String(loans[i1].accounts[i2].transfers[i3].date[1]).padStart(2,`0`)
				loans[i1].accounts[i2].transfers[i3].date[2]=String(loans[i1].accounts[i2].transfers[i3].date[2]).padStart(2,`0`)
				if(i3>0){
					loans[i1].accounts[i2].transfers[i3].period=Math.round((new Date(loans[i1].accounts[i2].transfers[i3].date.join(`/`))-new Date(loans[i1].accounts[i2].transfers[i3-1].date.join(`/`)))/86400000)
					if(loans[i1].accounts[i2].interestRate){
						interestSum+=loans[i1].accounts[i2].transfers[i3].interest=calculateInterest(
							Math.abs(transfersSum-interestSum)
							,loans[i1].accounts[i2].interestRate
							,loans[i1].accounts[i2].transfers[i3].period)
					}
				}
				transfersSum+=loans[i1].accounts[i2].transfers[i3].transfer
			}
			if(loans[i1].accounts[i2].interestRate){
				interestSum+=calculateInterest(
					Math.abs(transfersSum-interestSum)
					,loans[i1].accounts[i2].interestRate
					,Math.round((new Date()-new Date(loans[i1].accounts[i2].transfers[loans[i1].accounts[i2].transfers.length-1].date.join(`/`)))/86400000))
			}
			loans[i1].accounts[i2].transfersSum=parseFloat(transfersSum.toFixed(2))
			loans[i1].accounts[i2].interestSum=parseFloat(interestSum.toFixed(2))
			accountsSum+=transfersSum-interestSum
		}
		loans[i1].accountsSum=parseFloat(accountsSum.toFixed(2))
	}
	sortArrays(stage)
}
function calculateInterest(balance,interestRate,days){
	const INTEREST_RATE_PER_DAY=interestRate/365
	let interestAccrued=0
	for(let i1=0;i1<days;i1++){
		interestAccrued+=(balance+interestAccrued)*INTEREST_RATE_PER_DAY
	}
	return interestAccrued
}
function sortArrays(stage){
	loans=loans.sort(function(a,b){return a.accountsSum-b.accountsSum})
	for(let i1=0;i1<loans.length;i1++){
		loans[i1].accounts=loans[i1].accounts.sort(function(a,b){return a.transfersSum-b.transfersSum})
	}
	for(let i1=0;i1<assets.liquid.length;i1++){
		assets.liquid[i1].records=assets.liquid[i1].records.sort(function(a,b){return a.date.join(``)-b.date.join(``)})
	}
	for(let i1=0;i1<assets.illiquid.length;i1++){
		assets.illiquid[i1].records=assets.illiquid[i1].records.sort(function(a,b){return a.date.join(``)-b.date.join(``)})
	}
	renderMenu(stage)
}
let assets={liquid:[],illiquid:[]}
let loans=[]
function renderMenu(stage){
	if(assets.liquid.length||assets.illiquid.length||loans.length){
		renderAssets()
		renderLoans(``,stage??0)
	}
}
function renderAssets(){
	const DATE_TODAY=new Date(`${new Date().getFullYear()}/${new Date().getMonth()+1}/${new Date().getDate()}`)
	let contentQueue=``
	for(let i1=0;i1<assets.liquid.length;i1++){
		const ACCOUNT_RECORDS=assets.liquid[i1].records
		const DAYS_SINCE_UPDATE=(DATE_TODAY-new Date(ACCOUNT_RECORDS[ACCOUNT_RECORDS.length-1].date.join(`/`)))/86400000
		const COLOUR=DAYS_SINCE_UPDATE>0?`red`:`green`
		contentQueue+=`
			<details name="assets" style="color:${COLOUR};">
				<summary>
					<span>${assets.liquid[i1].title}</span>
				</summary>
				<span style="color:green;">$${numberWithCommas(ACCOUNT_RECORDS[ACCOUNT_RECORDS.length-1].balance)}</span>
				<br>
				<canvas id="sparkline${assets.liquid[i1].title}" class="sparkline" width="99" height="20"></canvas>
				<br>
				<span>updated</span> 
				${
					DAYS_SINCE_UPDATE>0?
					`${
						DAYS_SINCE_UPDATE>1?
						`${DAYS_SINCE_UPDATE} days ago`:
						`yesterday`
					}`:
					`today`
				}
			</details>`
	}
	document.getElementById(`assetsLiquid`).innerHTML=contentQueue
	for(let i1=0;i1<assets.liquid.length;i1++){
		drawSparkline(`sparkline${assets.liquid[i1].title}`,assets.liquid[i1].records,assets.liquid[i1].period,assets.liquid[i1].balanceAverage)
	}
	contentQueue=``
	for(let i1=0;i1<assets.illiquid.length;i1++){
		const ACCOUNT_RECORDS=assets.illiquid[i1].records
		const DAYS_SINCE_UPDATE=(DATE_TODAY-new Date(ACCOUNT_RECORDS[ACCOUNT_RECORDS.length-1].date.join(`/`)))/86400000
		const COLOUR=DAYS_SINCE_UPDATE>0?`red`:`green`
		contentQueue+=`
			<details name="assets" style="color:${COLOUR};">
				<summary>
					<span>${assets.illiquid[i1].title}</span>
				</summary>
				<span style="color:green;">$${numberWithCommas(ACCOUNT_RECORDS[ACCOUNT_RECORDS.length-1].balance)}</span>
				<br>
				<canvas id="sparkline${assets.illiquid[i1].title}" class="sparkline" width="99" height="20"></canvas>
				<br>
				<span>updated</span> 
				${
					DAYS_SINCE_UPDATE>0?
					`${
						DAYS_SINCE_UPDATE>1?
						`${DAYS_SINCE_UPDATE} days ago`:
						`yesterday`
					}`:
					`today`
				}
			</details>`
	}
	document.getElementById(`assetsIlliquid`).innerHTML=contentQueue
	for(let i1=0;i1<assets.illiquid.length;i1++){
		drawSparkline(`sparkline${assets.illiquid[i1].title}`,assets.illiquid[i1].records,assets.illiquid[i1].period,assets.illiquid[i1].balanceAverage)
	}
	contentQueue=``
	if(loans.length){
		let loansTotal=0
		for(let i1=0;i1<loans.length;i1++){
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
function drawSparkline(canvasId,dataPoints,period,balanceAverage){
	let canvas=document.getElementById(canvasId)
	let canvasContext=canvas.getContext(`2d`)
	canvasContext.clearRect(0,0,canvas.width,canvas.height)
	const maxValue=dataPoints.reduce(function(prev,current){
		return(prev&&prev.balance>current.balance)?prev:current
	})
	const minValue=dataPoints.reduce(function(prev,current){
		return(prev&&prev.balance<current.balance)?prev:current
	})
	const yScale=(canvas.height-2)/(maxValue.balance-minValue.balance)
	const xScale=(canvas.width-2)/(period)
	canvasContext.beginPath()
	canvasContext.moveTo(1,canvas.height-(dataPoints[0].balance-minValue.balance)*yScale)
	let periodAccrued=0
	for(let i1=1;i1<dataPoints.length;i1++){
		periodAccrued+=dataPoints[i1].period
		const X=periodAccrued*xScale+1
		const Y=canvas.height-(dataPoints[i1].balance-minValue.balance)*yScale
		canvasContext.lineTo(X,Y)
	}
	canvasContext.lineWidth=1
	canvasContext.strokeStyle=dataPoints[dataPoints.length-1].balance>balanceAverage?`green`:`red`
	canvasContext.stroke()
	canvasContext.beginPath()
	canvasContext.moveTo(1,canvas.height-(balanceAverage-minValue.balance)*yScale)
	canvasContext.lineTo(canvas.width,canvas.height-(balanceAverage-minValue.balance)*yScale)
	canvasContext.lineWidth=1
	canvasContext.setLineDash([1,1])
	canvasContext.strokeStyle=`black`
	canvasContext.stroke()
}
let globalCounterpartyIndex=0
let globalAccountIndex=0
let open=0
function renderLoans(isOpen,stage,counterpartyIndex,accountIndex){
	if(counterpartyIndex+1)globalCounterpartyIndex=counterpartyIndex
	if(accountIndex+1)globalAccountIndex=accountIndex
	let contentQueue=``
	if(isOpen){
		stage--
	}
	if(!stage){
		for(let i1=0;i1<loans.length;i1++){
			const COLOUR=loans[i1].accountsSum>=0?`green`:`red`
			contentQueue+=`
				<details onClick="renderLoans(this.open,1,${i1})" name="counterparty" ${open?`${i1==globalCounterpartyIndex?`open`:``}`:``} style="color:${COLOUR};">
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
		for(let i1=0;i1<loans[globalCounterpartyIndex].accounts.length;i1++){
			const COLOUR=loans[globalCounterpartyIndex].accounts[i1].transfersSum>=0?`green`:`red`
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
				}style="color:${COLOUR};">
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
		for(let i1=0;i1<loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers.length;i1++){
			const COLOUR=loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer>=0?`green`:`red`
			contentQueue+=`
				<details style="color:${COLOUR};">
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
	const OPTIONS=document.getElementById(`trackingSections`).options
	for(let i1=0;i1<OPTIONS.length;i1++)document.getElementById(`content${OPTIONS[i1].text}`).style=`display:none;`
	document.getElementById(`content${value}`).style=``
}
function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g,`,`);
}
let isMemoryChanged=0
function createAssetsEntry(section){
	let account=prompt(`
		Which account are you updating??\n
		(an unrecognised account title will create a new account)`)
	if(!account)return
	let date=prompt(`
		On which date are you recording a balance?\n
		(format: yyyy-mm-dd)`)
	if(!date)return
	while(!/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/.test(date)){
		alert(`You did not enter an acceptable date.`)
		date=prompt(`
			On which date are you recording a balance?\n
			(format: yyyy-mm-dd)`)
	}
	let balance=prompt(`What's the balance of the account?`)
	if(!balance)return
	while(!/^\-?[0-9]+(\.[0-9][0-9]?)?$/.test(balance)){
		alert(`You did not enter an acceptable number.`)
		let balance=prompt(`
			What's the balance of the account?\n
			(format: non-segmented numbers only)`)
	}
	let existing=0
	for(let i1=0;i1<assets[section].length;i1++){
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
	let stage
	if(section==`counterparties`){
		stage=0
		let i2=1
		for(let i1=0;i1<i2;i1++){
			let title=prompt(`Who is the counterparty to the loan?`)
			if(!title)return
			for(let i3=0;i3<loans.length;i3++){
				if(loans[i3].counterparty==title){
					i2++
					alert(`That counterparty already exists.`)
				}
			}
		}
		loans.push({accounts:[],counterparty:title})
	}else if(section==`accounts`){
		stage=1
		let i2=1
		for(let i1=0;i1<i2;i1++){
			let title=prompt(`What is the purpose of the loan?`)
			if(!title)return
			for(let i3=0;i3<loans[counterpartyIndex].accounts.length;i3++){
				if(loans[counterpartyIndex].accounts[i3].title==title){
					i2++
					alert(`That account already exists.`)
				}
			}
		}
		loans[globalCounterpartyIndex].accounts.push({title:title,transfers:[]})
	}else if(section==`transfers`){
		stage=2
		let date=prompt(`
			When did the transfer occur?\n
			(format: yyyy-mm-dd)`)
		if(!date)return
		while(!/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/.test(date)){
			alert(`You did not enter an acceptable date.`)
			date=prompt(`
				When did the transfer occur?\n
				(format: yyyy-mm-dd)`)
		}
		let transfer=prompt(`How much money was transferred?`)
		if(!transfer)return
		while(!/^\-?[0-9]+(\.[0-9][0-9]?)?$/.test(transfer)){
			alert(`You did not enter an acceptable number.`)
			let transfer=prompt(`
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
const dateToOrdinalSuffix=(date)=>{
	if(date>3&&date<21)return`th`
	switch(date%10){
		case 1:
			return`st`
		case 2:
			return`nd`
		case 3:
			return`rd`
		default:
			return`th`
	}
}
const monthToMonthName=[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`]
function downloadMemory(){
	if(!(loans.length+assets.liquid.length+assets.illiquid.length)){
		alert(`There is no data to save.`)
		return
	}
	const arrayedDate=new Date().toISOString().split(`T`)[0].split(`-`)
	const filename=`financials (${arrayedDate[2]}${dateToOrdinalSuffix(arrayedDate[2])} ${monthToMonthName[parseInt(arrayedDate[1])-1]} ${arrayedDate[0]}).js`
	const content=`// filename uses UTC for timezone for consistency\nassets=${JSON.stringify(assets,null)}\nloans=${JSON.stringify(loans,null)}`
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