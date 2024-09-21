function closeLandingModal(){
	document.getElementById(`landing-modal`).style=`animation:fade-out .2s forwards;`
	document.getElementById(`content`).style=`animation:fade-in .2s;`
}
let assets={liquid:[],illiquid:[]}
let loans=[]
function uploadFile(file){
	closeLandingModal()
	let files=event.target.files
	let fileReader=new FileReader()
	fileReader.readAsText(files[0])
	fileReader.onload=function(e){
		try{
			const data=JSON.parse(e.target.result)
			if(data.assets.illiquid.length&&data.assets.liquid.length)assets=data.assets
			if(data.loans.length)loans=data.loans
			calculateAdditionalInformation()
		}catch(error){
			console.error(`Error parsing JSON:`,error)
		}
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
							(transfersSum-interestSum)*-1
							,loans[i1].accounts[i2].interestRate
							,loans[i1].accounts[i2].transfers[i3].period)
					}
				}
				transfersSum+=loans[i1].accounts[i2].transfers[i3].transfer
			}
			if(loans[i1].accounts[i2].interestRate&&loans[i1].accounts[i2].transfers.length){
				interestSum+=calculateInterest(
					(transfersSum-interestSum)*-1
					,loans[i1].accounts[i2].interestRate
					,Math.round((new Date()-new Date(loans[i1].accounts[i2].transfers[loans[i1].accounts[i2].transfers.length-1].date.join(`/`)))/86400000))
			}
			loans[i1].accounts[i2].transfersSum=parseFloat(transfersSum)
			loans[i1].accounts[i2].interestSum=parseFloat(interestSum)
			accountsSum+=transfersSum-interestSum
		}
		loans[i1].accountsSum=parseFloat(accountsSum)
	}
	sortArrays(stage)
}
function calculateInterest(balance,interestRate,days){
	const INTEREST_RATE_PER_DAY=interestRate/365
	let interestAccrued=0
	for(let i1=0;i1<days;i1++){
		if(balance+interestAccrued<=0)break
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
		const COLOUR=DAYS_SINCE_UPDATE>0
			?`red`
			:`green`
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
				${DAYS_SINCE_UPDATE>0
					?`${DAYS_SINCE_UPDATE>1
						?`${DAYS_SINCE_UPDATE} days ago`
						:`yesterday`}`
					:`today`
				}
			</details>`
	}
	document.getElementById(`assets-liquid`).innerHTML=contentQueue
	for(let i1=0;i1<assets.liquid.length;i1++){
		drawSparkline(`sparkline${assets.liquid[i1].title}`,assets.liquid[i1].records,assets.liquid[i1].period,assets.liquid[i1].balanceAverage)
	}
	contentQueue=``
	for(let i1=0;i1<assets.illiquid.length;i1++){
		const ACCOUNT_RECORDS=assets.illiquid[i1].records
		const DAYS_SINCE_UPDATE=(DATE_TODAY-new Date(ACCOUNT_RECORDS[ACCOUNT_RECORDS.length-1].date.join(`/`)))/86400000
		const COLOUR=DAYS_SINCE_UPDATE>0
			?`red`
			:`green`
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
				${DAYS_SINCE_UPDATE>0
					?`${DAYS_SINCE_UPDATE>1?
						`${DAYS_SINCE_UPDATE} days ago`:
						`yesterday`}`
					:`today`}
			</details>`
	}
	document.getElementById(`assets-illiquid`).innerHTML=contentQueue
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
				${loansTotal<0
					?`$${numberWithCommas(Math.abs(loansTotal).toFixed(2))}`
					:`<span style="color:red;">-$${numberWithCommas(Math.abs(loansTotal).toFixed(2))}</span>`}
				<br>
				<span>updated</span> automatically
			</details>`
	}
	document.getElementById(`assets-intangible`).innerHTML=contentQueue
}
function drawSparkline(canvasId,dataPoints,period,balanceAverage){
	let canvas=document.getElementById(canvasId)
	let canvasContext=canvas.getContext(`2d`)
	canvasContext.clearRect(0,0,canvas.width,canvas.height)
	const maxValue=dataPoints.reduce(function(prev,current){
		return(prev&&prev.balance>current.balance)
			?prev
			:current
	})
	const minValue=dataPoints.reduce(function(prev,current){
		return(prev&&prev.balance<current.balance)
			?prev
			:current
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
	canvasContext.strokeStyle=dataPoints[dataPoints.length-1].balance>balanceAverage
		?`green`
		:`red`
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
			const COLOUR=loans[i1].accountsSum>=0
				?`green`
				:`red`
			const REMAINING_BALANCE_INDICATION=loans[i1].accountsSum>=0
				?`<span>surplus</span><br>`
				:`<span>outstanding</span><br>`
			contentQueue+=`
				<details onClick="renderLoans(this.open,1,${i1})" name="counterparty" ${(open&&i1==globalCounterpartyIndex)?`open`:``} style="color:${COLOUR};">
					<summary>
						<span>${loans[i1].counterparty}</span>
					</summary>
					$${numberWithCommas(Math.abs(loans[i1].accountsSum).toFixed(2))} ${REMAINING_BALANCE_INDICATION}
				</details>`
		}
		document.getElementById(`loans-counterparties`).innerHTML=contentQueue
		document.getElementById(`loans-accounts`).innerHTML=``
		document.getElementById(`loans-accounts-header`).innerHTML=`
			<span>ACCOUNTS</span>`
		document.getElementById(`loans-transfers`).innerHTML=``
		document.getElementById(`loans-transfers-header`).innerHTML=`
			<span>TRANSFERS</span>`
	}
	if(stage==1){
		document.getElementById(`loans-accounts-header`).innerHTML=`
			<span>ACCOUNTS</span>
			<span onClick="createEntry('loans','accounts',${globalCounterpartyIndex})" class="button create-entry">+</span>`
		for(let i1=0;i1<loans[globalCounterpartyIndex].accounts.length;i1++){
			const COLOUR=loans[globalCounterpartyIndex].accounts[i1].transfersSum>=0
				?`green`
				:`red`
			const REMAINING_BALANCE_INDICATION=(loans[globalCounterpartyIndex].accounts[i1].transfersSum-loans[globalCounterpartyIndex].accounts[i1].interestSum)>=0
				?`<span>surplus</span><br>`
				:`<span>outstanding</span><br>`
			contentQueue+=`
				<details onClick="renderLoans(this.open,2,${globalCounterpartyIndex},${i1})" name="account" ${(open&&i1==globalAccountIndex)?`open`:``} style="color:${COLOUR};">
					<summary>
						<span>${loans[globalCounterpartyIndex].accounts[i1].title}</span>
					</summary>
					${loans[globalCounterpartyIndex].accounts[i1].interestRate
						?`${loans[globalCounterpartyIndex].accounts[i1].interestRate*100}% <span>interest per annum</span><br>`
						:``}
					$${numberWithCommas(Math.abs(loans[globalCounterpartyIndex].accounts[i1].transfersSum-loans[globalCounterpartyIndex].accounts[i1].interestSum).toFixed(2))} ${REMAINING_BALANCE_INDICATION}
				</details>`
		}
		document.getElementById(`loans-accounts`).innerHTML=contentQueue
		document.getElementById(`loans-transfers`).innerHTML=``
		document.getElementById(`loans-transfers-header`).innerHTML=`
			<span>TRANSFERS</span>`
	}else if(stage==2){
		document.getElementById(`loans-transfers-header`).innerHTML=`
			<span>TRANSFERS</span>
			<span onClick="createEntry('loans','transfers',${globalCounterpartyIndex},${globalAccountIndex})" class="button create-entry">+</span>`
		for(let i1=0;i1<loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers.length;i1++){
			const COLOUR=loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer>=0
				?`green`
				:`red`
			contentQueue+=`
				<details style="color:${COLOUR};">
					<summary>
						<span>${loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].date.join(`-`)}</span>
					</summary>
					${loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer>=0
						?`+$${numberWithCommas(loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer)}`
						:`-$${numberWithCommas(Math.abs(loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer))}`}
					${loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].period
						?`<br><span>${loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].period} days from last transfer</span>`
						:``}
					${loans[globalCounterpartyIndex].accounts[globalAccountIndex].interestRate
						?`<br>${loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].interest
							?`<span style="color:red;">$${numberWithCommas(loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].interest.toFixed(2))}</span> <span>interest accrued</span>`
							:``}`
						:``}
				</details>`
		}
		document.getElementById(`loans-transfers`).innerHTML=contentQueue
	}
	open=0
}
function changeContent(value){
	const OPTIONS=document.getElementById(`tracking-sections`).options
	for(let i1=0;i1<OPTIONS.length;i1++)document.getElementById(`content-${OPTIONS[i1].text.toLowerCase()}`).style=`display:none;`
	document.getElementById(`content-${value.toLowerCase()}`).style=``
}
function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g,`,`)
}
const INSERTION_TEMPLATE_LOANS={
	counterparties:{
		title:`COUNTERPARTY`,
		fields:`
			<span id="data-entry-name-wrapper" data-before="!" style="color:initial;">
				<input id="data-entry-name" type="text" placeholder="Counterparty name..." onKeyUp="testValidity(this.id)"/>
			</span>`},
	accounts:{
		title:`ACCOUNT`,
		fields:`
			<span id="data-entry-name-wrapper" data-before="!" style="color:initial;">
				<input id="data-entry-name" type="text" placeholder="Account name..." onKeyUp="testValidity(this.id)"/>
			</span>
			<span id="data-entry-interest-wrapper" data-before="!" style="color:initial;">
				<input id="data-entry-interest" type="number" placeholder="Interest rate..." onKeyUp="testValidity(this.id)"/>
			</span>`},
	transfers:{
		title:`TRANSFER`,
		fields:`
			<span id="data-entry-value-wrapper" data-before="!" style="color:initial;">
				<input id="data-entry-value" type="number" placeholder="Transfer amount..." onKeyUp="testValidity(this.id)"/>
			</span>
			<span id="data-entry-value-date-wrapper" data-before="!" style="color:initial;">
				<input id="data-entry-value-date" type="date" onChange="testValidity(this.id)"/>
			</span>`}
}
let isMemoryChanged=0
function createEntry(sectionMajor,sectionMinor,counterpartyIndex,accountIndex){
	document.getElementById(`page-cover`).classList.add(`cover`)
	document.getElementById(`data-entry`).style=`animation:fade-in .2s forwards;`
	switch(sectionMajor){
		case `assets`:
			document.getElementById(`data-entry`).innerHTML=`
				<h3 style="font-family:'montserrat-bold';">UPDATE ACCOUNT</h3>
				<div style="display:flex;flex-direction:column;">
					<span id="data-entry-name-wrapper" data-before="!" style="color:initial;">
						<input id="data-entry-name" type="text" placeholder="Account name..." onKeyUp="testValidity(this.id)"/>
					</span>
					<span id="data-entry-value-wrapper" data-before="!" style="color:initial;">
						<input id="data-entry-value" type="number" placeholder="Account balance..." onKeyUp="testValidity(this.id)"/>
					</span>
					<span id="data-entry-value-date-wrapper" data-before="!" style="color:initial;">
						<input id="data-entry-value-date" type="date" onChange="testValidity(this.id)"/>
					</span>
				</div>
				<h3 style="display:flex;gap:.5rem;justify-content:center;">
					<div onClick="closeDataEntry()" class="button button-close">
						Cancel
					</div>
					<div class="button button-continue" onClick="submitData('${sectionMajor}','${sectionMinor}')">
						Submit
					</div>
				</h3>
				<div style="padding:0 10%;">
					psst..
					<h6>
						an unrecognised account title will create a new account.
					</h6>
				</div>`
			break
		case `loans`:
			document.getElementById(`data-entry`).innerHTML=`
				<h3 style="font-family:'montserrat-bold';">NEW ${INSERTION_TEMPLATE_LOANS[sectionMinor].title}</h3>
				<div style="display:flex;flex-direction:column;">
					${INSERTION_TEMPLATE_LOANS[sectionMinor].fields}
				</div>
				<h3 style="display:flex;gap:.5rem;justify-content:center;">
					<div onClick="closeDataEntry()" class="button button-close">
						Cancel
					</div>
					<div class="button button-continue" onClick="submitData('${sectionMajor}','${sectionMinor}')">
						Submit
					</div>
				</h3>`
			break
	}
}
function testValidity(elementID){
	if(document.getElementById(elementID).value.length)
		document.getElementById(`${elementID}-wrapper`).setAttribute(`data-before`,``)
	else
		document.getElementById(`${elementID}-wrapper`).setAttribute(`data-before`,`!`)
}
function closeDataEntry(){
	document.getElementById(`page-cover`).classList.remove(`cover`)
	document.getElementById(`data-entry`).style=`animation:fade-out .2s forwards;`
}
function submitData(sectionMajor,sectionMinor){
	let stage
	switch(sectionMajor){
		case `assets`:
			if(!document.getElementById(`data-entry-name`).value.length)return
			if(!document.getElementById(`data-entry-value`).value.length)return
			if(!document.getElementById(`data-entry-value-date`).value.length)return
			for(let i1=0;i1<assets[sectionMinor].length;i1++){
				if(document.getElementById(`data-entry-name`).value==assets[sectionMinor][i1].title){
					assets[sectionMinor][i1].records=assets[sectionMinor][i1].records.filter(record=>record.date.join(`-`)!=document.getElementById(`data-entry-value-date`).value)
					assets[sectionMinor][i1].records.push(
						{date:document.getElementById(`data-entry-value-date`).value.split(`-`)
						,balance:parseFloat(document.getElementById(`data-entry-value`).value)})
					closeDataEntry()
					isMemoryChanged=1
					calculateAdditionalInformation()
					return
				}
			}
			assets[sectionMinor==`liquid`?`liquid`:`illiquid`].push(
				{title:document.getElementById(`data-entry-name`).value
				,records:[
					{date:document.getElementById(`data-entry-value-date`).value.split(`-`)
					,balance:parseFloat(document.getElementById(`data-entry-value`).value)}]})
			break
		case `loans`:
			switch(sectionMinor){
				case `counterparties`:
					stage=0
					if(!document.getElementById(`data-entry-name`).value.length)return
					loans.push(
						{counterparty:document.getElementById(`data-entry-name`).value
						,accounts:[]})
					break
				case `accounts`:
					stage=1
					if(!document.getElementById(`data-entry-name`).value.length)return
					if(!/^[0-9]+(\.[0-9]{1,2})?$/.test(document.getElementById(`data-entry-interest`).value)){
						return
					}
					loans[globalCounterpartyIndex].accounts.push(
						{title:document.getElementById(`data-entry-name`).value
						,interestRate:document.getElementById(`data-entry-interest`).value/100
						,transfers:[]})
					break
				case `transfers`:
					stage=2
					if(!document.getElementById(`data-entry-value`).value.length)return
					if(!document.getElementById(`data-entry-value-date`).value.length)return
					loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers.push(
						{date:document.getElementById(`data-entry-value-date`).value.split(`-`)
						,transfer:parseFloat(document.getElementById(`data-entry-value`).value)})
					open=1
					calculateAdditionalInformation(0)
					open=1
					calculateAdditionalInformation(1)
					break
			}
			break
	}
	closeDataEntry()
	isMemoryChanged=1
	calculateAdditionalInformation(stage??``)
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
const monthToMonthName=
	[`Jan`
	,`Feb`
	,`Mar`
	,`Apr`
	,`May`
	,`Jun`
	,`Jul`
	,`Aug`
	,`Sep`
	,`Oct`
	,`Nov`
	,`Dec`]
const UNNECESSARY_PROPERTIES=
	[`period`
	,`balanceAverage`
	,`interest`
	,`transfersSum`
	,`interestSum`
	,`accountsSum`
	,`daysFromLastTransfer`]
function replacer(key,value){
	for(let i1=0;i1<UNNECESSARY_PROPERTIES.length;i1++){
		if(key===UNNECESSARY_PROPERTIES[i1])return undefined
	}
	return value
}
function downloadMemory(){
	if(!(loans.length+assets.liquid.length+assets.illiquid.length)){
		alert(`There is no data to save.`)
		return
	}
	const data={assets:assets,loans:loans}
	const arrayedDate=new Date().toISOString().split(`T`)[0].split(`-`)
	const filename=`financials (${arrayedDate[2]}${dateToOrdinalSuffix(arrayedDate[2])} ${monthToMonthName[parseInt(arrayedDate[1])-1]} ${arrayedDate[0]} UTC).json`
	const content=`${JSON.stringify(data,replacer)}`
	const file=new Blob([content],{type:`application/json`})
	const link=document.createElement(`a`)
	link.href=URL.createObjectURL(file)
	link.download=filename
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(link.href)
	isMemoryChanged=0
}