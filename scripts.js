function closeLandingModal(){
	document.getElementById(`landing-modal`).style=`animation:fade-out .2s forwards;`
	document.getElementById(`content`).style=`animation:fade-in .2s;`
	changeContent()
}
let financialHoldings={liquid:[],illiquid:[]}
let loans=[]
function uploadFile(file){
	closeLandingModal()
	let files=event.target.files
	let fileReader=new FileReader()
	fileReader.readAsText(files[0])
	fileReader.onload=function(e){
		try{
			const data=JSON.parse(e.target.result)
			if(data.financialHoldings.illiquid.length&&data.financialHoldings.liquid.length)financialHoldings=data.financialHoldings
			if(data.loans.length)loans=data.loans
			calculateAdditionalInformation()
		}catch(error){
			console.error(`Error parsing JSON:`,error)
		}
	}
}
function calculateAdditionalInformation(stage){
	//	financial holdings
	for(let i1=0;i1<financialHoldings.liquid.length;i1++){
		financialHoldings.liquid[i1].daysSinceLastTransfer=Math.round((new Date(financialHoldings.liquid[i1].records[financialHoldings.liquid[i1].records.length-1].date.join(`/`))-new Date(financialHoldings.liquid[i1].records[0].date.join(`/`)))/86400000)
		financialHoldings.liquid[i1].records[0].daysSinceLastTransfer=0
		let balanceAverage=financialHoldings.liquid[i1].records[0].balance
		for(let i2=1;i2<financialHoldings.liquid[i1].records.length;i2++){
			financialHoldings.liquid[i1].records[i2].daysSinceLastTransfer=Math.round((new Date(financialHoldings.liquid[i1].records[i2].date.join(`/`))-new Date(financialHoldings.liquid[i1].records[i2-1].date.join(`/`)))/86400000)
			balanceAverage+=financialHoldings.liquid[i1].records[i2].balance
		}
		financialHoldings.liquid[i1].balanceAverage=balanceAverage/financialHoldings.liquid[i1].records.length
	}
	for(let i1=0;i1<financialHoldings.illiquid.length;i1++){
		financialHoldings.illiquid[i1].daysSinceLastTransfer=Math.round((new Date(financialHoldings.illiquid[i1].records[financialHoldings.illiquid[i1].records.length-1].date.join(`/`))-new Date(financialHoldings.illiquid[i1].records[0].date.join(`/`)))/86400000)
		financialHoldings.illiquid[i1].records[0].daysSinceLastTransfer=0
		let balanceAverage=financialHoldings.illiquid[i1].records[0].balance
		for(let i2=1;i2<financialHoldings.illiquid[i1].records.length;i2++){
			financialHoldings.illiquid[i1].records[i2].daysSinceLastTransfer=Math.round((new Date(financialHoldings.illiquid[i1].records[i2].date.join(`/`))-new Date(financialHoldings.illiquid[i1].records[i2-1].date.join(`/`)))/86400000)
			balanceAverage+=financialHoldings.illiquid[i1].records[i2].balance
		}
		financialHoldings.illiquid[i1].balanceAverage=balanceAverage/financialHoldings.illiquid[i1].records.length
	}
	//	loans
	for(let i1=0;i1<loans.length;i1++){
		let sumOfAccounts=0
		for(let i2=0;i2<loans[i1].accounts.length;i2++){
			let sumOfTransfers=0
			let sumOfInterest=0
			for(let i3=0;i3<loans[i1].accounts[i2].transfers.length;i3++){
				loans[i1].accounts[i2].transfers[i3].date[1]=String(loans[i1].accounts[i2].transfers[i3].date[1]).padStart(2,`0`)
				loans[i1].accounts[i2].transfers[i3].date[2]=String(loans[i1].accounts[i2].transfers[i3].date[2]).padStart(2,`0`)
				if(i3>0){
					loans[i1].accounts[i2].transfers[i3].daysSinceLastTransfer=Math.round((new Date(loans[i1].accounts[i2].transfers[i3].date.join(`/`))-new Date(loans[i1].accounts[i2].transfers[i3-1].date.join(`/`)))/86400000)
					if(loans[i1].accounts[i2].interestRate){
						const BALANCE=(sumOfTransfers-sumOfInterest)*-1
						const INTEREST_RATE_PER_DAY=loans[i1].accounts[i2].interestRate/365
						const TIME_BETWEEN_TRANSFERS=loans[i1].accounts[i2].transfers[i3].daysSinceLastTransfer
						if(BALANCE>=0)
							sumOfInterest+=loans[i1].accounts[i2].transfers[i3].interest=BALANCE*(1+INTEREST_RATE_PER_DAY)**TIME_BETWEEN_TRANSFERS-BALANCE
					}
				}
				sumOfTransfers+=loans[i1].accounts[i2].transfers[i3].transfer
			}
			if(loans[i1].accounts[i2].interestRate&&loans[i1].accounts[i2].transfers.length){
				const BALANCE=(sumOfTransfers-sumOfInterest)*-1
				const TIME_SINCE_LAST_TRANSFER=Math.round((new Date()-new Date(loans[i1].accounts[i2].transfers[loans[i1].accounts[i2].transfers.length-1].date.join(`/`)))/86400000)
				if(BALANCE>=0)
					sumOfInterest+=loans[i1].accounts[i2].transfers[i3].interest=BALANCE*(1+INTEREST_RATE_PER_DAY)**TIME_SINCE_LAST_TRANSFER-BALANCE
			}
			loans[i1].accounts[i2].sumOfTransfers=parseFloat(sumOfTransfers)
			loans[i1].accounts[i2].sumOfInterest=parseFloat(sumOfInterest)
			sumOfAccounts+=sumOfTransfers-sumOfInterest
		}
		loans[i1].sumOfAccounts=parseFloat(sumOfAccounts)
	}
	//
	sortArrays(stage)
}
function sortArrays(stage){
	//	financial holdings
	for(let i1=0;i1<financialHoldings.liquid.length;i1++)
		financialHoldings.liquid[i1].records=financialHoldings.liquid[i1].records.sort(function(a,b){return a.date.join(``)-b.date.join(``)})
	for(let i1=0;i1<financialHoldings.illiquid.length;i1++)
		financialHoldings.illiquid[i1].records=financialHoldings.illiquid[i1].records.sort(function(a,b){return a.date.join(``)-b.date.join(``)})
	//	loans
	if(globalCounterpartyIndex){
		let GLOBAL_COUNTERPARTY_NAME=loans[globalCounterpartyIndex].counterparty
		loans=loans.sort(function(a,b){return a.sumOfAccounts-b.sumOfAccounts})
		globalCounterpartyIndex=loans.findIndex(counterparties=>counterparties.counterparty===GLOBAL_COUNTERPARTY_NAME)
		if(globalAccountIndex){
			let GLOBAL_ACCOUNT_TITLE=loans[globalCounterpartyIndex].accounts[globalAccountIndex].account
			for(let i1=0;i1<loans.length;i1++)
				loans[i1].accounts=loans[i1].accounts.sort(function(a,b){return a.sumOfTransfers-b.sumOfTransfers})
			globalAccountIndex=loans[globalCounterpartyIndex].accounts.findIndex(accounts=>accounts.account===GLOBAL_ACCOUNT_TITLE)
		}
	}
	//
	renderContent(stage)
}
function renderContent(stage){
	switch(selectedContentArea){
		case `FinancialHoldings`:
			renderFinancialHoldings()
			break
		case `Loans`:
			renderLoans(``,stage??0)
			break
	}
}
function renderFinancialHoldings(){
	const DATE_TODAY=new Date(`${new Date().getFullYear()}/${new Date().getMonth()+1}/${new Date().getDate()}`)
	let contentQueue=``
	for(let i1=0;i1<financialHoldings.liquid.length;i1++){
		const ACCOUNT_RECORDS=financialHoldings.liquid[i1].records
		const DAYS_SINCE_UPDATE=(DATE_TODAY-new Date(ACCOUNT_RECORDS[ACCOUNT_RECORDS.length-1].date.join(`/`)))/86400000
		const COLOUR=DAYS_SINCE_UPDATE>0
			?`red`
			:`green`
		const ACCOUNT=financialHoldings.liquid[i1].account
		const BALANCE=numberWithCommas(ACCOUNT_RECORDS[ACCOUNT_RECORDS.length-1].balance)
		const LAST_UPDATED=DAYS_SINCE_UPDATE>0
			?`${DAYS_SINCE_UPDATE>1
				?`${DAYS_SINCE_UPDATE} days ago`
				:`yesterday`}`
			:`today`
		contentQueue+=`
			<details name="financialHoldings" style="color:${COLOUR};">
				<summary>
					<span>${ACCOUNT}</span>
				</summary>
				<span style="color:green;">$${BALANCE}</span>
				<br>
				<canvas id="sparkline${ACCOUNT}" class="sparkline" width="99" height="20"></canvas>
				<br>
				<span>updated</span> 
				${LAST_UPDATED}
			</details>`
	}
	document.getElementById(`financial-holdings-liquid`).innerHTML=contentQueue
	for(let i1=0;i1<financialHoldings.liquid.length;i1++){
		drawSparkline(`sparkline${financialHoldings.liquid[i1].account}`,financialHoldings.liquid[i1].records,financialHoldings.liquid[i1].daysSinceLastTransfer,financialHoldings.liquid[i1].balanceAverage)
	}
	contentQueue=``
	for(let i1=0;i1<financialHoldings.illiquid.length;i1++){
		const ACCOUNT_RECORDS=financialHoldings.illiquid[i1].records
		const DAYS_SINCE_UPDATE=(DATE_TODAY-new Date(ACCOUNT_RECORDS[ACCOUNT_RECORDS.length-1].date.join(`/`)))/86400000
		const COLOUR=DAYS_SINCE_UPDATE>0
			?`red`
			:`green`
		const ACCOUNT=financialHoldings.illiquid[i1].account
		const BALANCE=numberWithCommas(ACCOUNT_RECORDS[ACCOUNT_RECORDS.length-1].balance)
		const LAST_UPDATED=DAYS_SINCE_UPDATE>0
			?`${DAYS_SINCE_UPDATE>1
				?`${DAYS_SINCE_UPDATE} days ago`
				:`yesterday`}`
			:`today`
		contentQueue+=`
			<details name="financialHoldings" style="color:${COLOUR};">
				<summary>
					<span>${ACCOUNT}</span>
				</summary>
				<span style="color:green;">$${BALANCE}</span>
				<br>
				<canvas id="sparkline${ACCOUNT}" class="sparkline" width="99" height="20"></canvas>
				<br>
				<span>updated</span> 
				${LAST_UPDATED}
			</details>`
	}
	document.getElementById(`financial-holdings-illiquid`).innerHTML=contentQueue
	for(let i1=0;i1<financialHoldings.illiquid.length;i1++){
		drawSparkline(`sparkline${financialHoldings.illiquid[i1].account}`,financialHoldings.illiquid[i1].records,financialHoldings.illiquid[i1].daysSinceLastTransfer,financialHoldings.illiquid[i1].balanceAverage)
	}
	contentQueue=``
	if(loans.length){
		let loansTotal=0
		for(let i1=0;i1<loans.length;i1++){
			loansTotal+=loans[i1].sumOfAccounts
		}
		const BALANCE=loansTotal<=0
			?`$${numberWithCommas(Math.abs(loansTotal).toFixed(2))}`
			:`<span style="color:red;">-$${numberWithCommas(Math.abs(loansTotal).toFixed(2))}</span>`
		contentQueue+=`
			<details name="financialHoldings" style="color:green;">
				<summary>
					<span>Loans</span>
				</summary>
				${BALANCE}
				<br>
				<span>updated</span> automatically
			</details>`
	}
	document.getElementById(`financial-holdings-intangible`).innerHTML=contentQueue
}
function drawSparkline(canvasId,dataPoints,daysSinceLastTransfer,balanceAverage){
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
	const xScale=(canvas.width-2)/(daysSinceLastTransfer)
	canvasContext.beginPath()
	canvasContext.moveTo(1,canvas.height-(dataPoints[0].balance-minValue.balance)*yScale)
	let daysSinceLastTransferAccrued=0
	for(let i1=1;i1<dataPoints.length;i1++){
		daysSinceLastTransferAccrued+=dataPoints[i1].daysSinceLastTransfer
		const X=daysSinceLastTransferAccrued*xScale+1
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
let globalCounterpartyIndex
let globalAccountIndex
let open=0
function renderLoans(isOpen,stage,counterpartyIndex,accountIndex){
	if(counterpartyIndex+1)globalCounterpartyIndex=counterpartyIndex
	if(accountIndex+1)globalAccountIndex=accountIndex
	let contentQueue=` `
	if(isOpen){
		stage--
	}
	//	counterparties
	if(!stage){
		const OPEN_IF_SELECTED_COUNTERPARTY=(index)=>{
			return (open&&index==globalCounterpartyIndex)
				?`open`
				:``
		}
		for(let i1=0;i1<loans.length;i1++){
			const FUNCTION_ON_CLICK=`renderLoans(this.open,1,${i1})`
			const COLOUR=loans[i1].sumOfAccounts>=0
				?`green`
				:`red`
			const COUNTERPARTY=loans[i1].counterparty
			const BALANCE_REMAINING_INDICATION=loans[i1].sumOfAccounts>=0
				?`<span>surplus</span><br>`
				:`<span>outstanding</span><br>`
			const BALANCE_REMAINING=`$${numberWithCommas(Math.abs(loans[i1].sumOfAccounts).toFixed(2))} ${BALANCE_REMAINING_INDICATION}`
			contentQueue+=`
				<details onClick="${FUNCTION_ON_CLICK}" name="counterparty" ${OPEN_IF_SELECTED_COUNTERPARTY(i1)} style="color:${COLOUR};">
					<summary>
						<span>${COUNTERPARTY}</span>
					</summary>
					${BALANCE_REMAINING}
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
	//	accounts
	if(stage==1){
		document.getElementById(`loans-accounts-header`).innerHTML=`
			<span>ACCOUNTS</span>
			<span onClick="createEntry('loans','accounts',${globalCounterpartyIndex})" class="button create-entry">+</span>`
		const OPEN_IF_SELECTED_ACCOUNT=(index)=>{
			return (open&&index==globalAccountIndex)
				?`open`
				:``
		}
		for(let i1=0;i1<loans[globalCounterpartyIndex].accounts.length;i1++){
			const FUNCTION_ON_CLICK=`renderLoans(this.open,2,${globalCounterpartyIndex},${i1})`
			const COLOUR=loans[globalCounterpartyIndex].accounts[i1].sumOfTransfers>=0
				?`green`
				:`red`
			const ACCOUNT=loans[globalCounterpartyIndex].accounts[i1].account
			const INTEREST_RATE=loans[globalCounterpartyIndex].accounts[i1].interestRate
				?`${loans[globalCounterpartyIndex].accounts[i1].interestRate*100}% <span>interest per annum</span><br>`
				:``
			const BALANCE_REMAINING_INDICATION=(loans[globalCounterpartyIndex].accounts[i1].sumOfTransfers-loans[globalCounterpartyIndex].accounts[i1].sumOfInterest)>=0
				?`<span>surplus</span><br>`
				:`<span>outstanding</span><br>`
			const BALANCE_REMAINING=`$${numberWithCommas(Math.abs(loans[globalCounterpartyIndex].accounts[i1].sumOfTransfers-loans[globalCounterpartyIndex].accounts[i1].sumOfInterest).toFixed(2))} ${BALANCE_REMAINING_INDICATION}`
			contentQueue+=`
				<details onClick="${FUNCTION_ON_CLICK}" name="account" ${OPEN_IF_SELECTED_ACCOUNT(i1)} style="color:${COLOUR};">
					<summary>
						<span>${ACCOUNT}</span>
					</summary>
					${INTEREST_RATE}
					${BALANCE_REMAINING}
				</details>`
		}
		document.getElementById(`loans-accounts`).innerHTML=contentQueue
		document.getElementById(`loans-transfers`).innerHTML=``
		document.getElementById(`loans-transfers-header`).innerHTML=`
			<span>TRANSFERS</span>`
	//	transfers
	}else if(stage==2){
		document.getElementById(`loans-transfers-header`).innerHTML=`
			<span>TRANSFERS</span>
			<span onClick="createEntry('loans','transfers',${globalCounterpartyIndex},${globalAccountIndex})" class="button create-entry">+</span>`
		for(let i1=0;i1<loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers.length;i1++){
			const COLOUR=loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer>=0
				?`green`
				:`red`
			const FORMATTED_DATE=loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].date.join(`-`)
			const TRANSFER=`${loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer>=0?`+`:`-`}$${numberWithCommas(Math.abs(loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer))}`
			const DAYS_SINCE_LAST_TRANSFER_FORMATTED=loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].daysSinceLastTransfer
				?`<br><span>${loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].daysSinceLastTransfer} days from last transfer</span>`
				:``
			const INTEREST_ACCRUED=(loans[globalCounterpartyIndex].accounts[globalAccountIndex].interestRate&&loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].interest)
				?`<br><span style="color:red;">$${numberWithCommas(loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].interest.toFixed(2))}</span> <span>interest accrued</span>`
				:``
			contentQueue+=`
				<details style="color:${COLOUR};">
					<summary>
						<span>${FORMATTED_DATE}</span>
					</summary>
					${TRANSFER}
					${DAYS_SINCE_LAST_TRANSFER_FORMATTED}
					${INTEREST_ACCRUED}
				</details>`
		}
		document.getElementById(`loans-transfers`).innerHTML=contentQueue
	}
	//
	open=0
}
const CONTENT_INNER={
	FinancialHoldings:`
		<div class="card wrapper">
			<h3 id="financial-holdings-liquid-header" class="header">
				<span>Liquid</span>
				<span onClick="createEntry('financialHoldings','liquid')" class="button create-entry">+</span>
			</h3>
			<div id="financial-holdings-liquid"></div>
		</div>
		<div class="card wrapper">
			<h3 id="financial-holdings-illiquid-header" class="header">
				<span>Illiquid</span>
				<span onClick="createEntry('financialHoldings','illiquid')" class="button create-entry">+</span>
			</h3>
			<div id="financial-holdings-illiquid"></div>
		</div>
		<div class="card wrapper">
			<h3 id="financial-holdings-intangible-header" class="header">
				<span>Intangible</span>
			</h3>
			<div id="financial-holdings-intangible" fade-if-empty></div>
		</div>`,
	Loans:`
		<div class="card wrapper">
			<h3 id="loans-counterparties-header" class="header">
				<span>COUNTERPARTIES</span>
				<span onClick="createEntry('loans','counterparties')" class="button create-entry">+</span>
			</h3>
			<div id="loans-counterparties"></div>
		</div>
		<div class="card wrapper">
			<h3 id="loans-accounts-header" class="header">
				<span>ACCOUNTS</span>
			</h3>
			<div id="loans-accounts" fade-if-empty></div>
		</div>
		<div class="card wrapper">
			<h3 id="loans-transfers-header" class="header">
				<span>TRANSFERS</span>
			</h3>
			<div id="loans-transfers" fade-if-empty></div>
		</div>`}
let selectedContentArea=`Financial Holdings`
function changeContent(){
	const CURRENT_CONTENT=document.getElementById(`tracking-sections`).value.replace(/ /g,``)
	document.getElementById(`content-inner`).innerHTML=CONTENT_INNER[CURRENT_CONTENT]
	selectedContentArea=CURRENT_CONTENT
	renderContent()
}
function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g,`,`)
}
const INSERTION_TEMPLATE_LOANS={
	counterparties:{
		section:`COUNTERPARTY`,
		fields:`
			<span id="data-entry-name-wrapper" data-before="!" style="color:initial;">
				<input id="data-entry-name" type="text" placeholder="Counterparty name..." onKeyUp="testValidity(this.id)"/>
			</span>`},
	accounts:{
		section:`ACCOUNT`,
		fields:`
			<span id="data-entry-name-wrapper" data-before="!" style="color:initial;">
				<input id="data-entry-name" type="text" placeholder="Account name..." onKeyUp="testValidity(this.id)"/>
			</span>
			<span id="data-entry-interest-wrapper" data-before="!" style="color:initial;">
				<input id="data-entry-interest" type="number" placeholder="Interest rate..." onKeyUp="testValidity(this.id)"/>
			</span>`},
	transfers:{
		section:`TRANSFER`,
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
		case `financialHoldings`:
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
				<h3 style="font-family:'montserrat-bold';">NEW ${INSERTION_TEMPLATE_LOANS[sectionMinor].section}</h3>
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
		case `financialHoldings`:
			if(!document.getElementById(`data-entry-name`).value.length)return
			if(!document.getElementById(`data-entry-value`).value.length)return
			if(!document.getElementById(`data-entry-value-date`).value.length)return
			for(let i1=0;i1<financialHoldings[sectionMinor].length;i1++){
				if(document.getElementById(`data-entry-name`).value==financialHoldings[sectionMinor][i1].account){
					financialHoldings[sectionMinor][i1].records=financialHoldings[sectionMinor][i1].records.filter(record=>record.date.join(`-`)!=document.getElementById(`data-entry-value-date`).value)
					financialHoldings[sectionMinor][i1].records.push(
						{date:document.getElementById(`data-entry-value-date`).value.split(`-`)
						,balance:parseFloat(document.getElementById(`data-entry-value`).value)})
					closeDataEntry()
					isMemoryChanged=1
					calculateAdditionalInformation()
					return
				}
			}
			financialHoldings[sectionMinor==`liquid`?`liquid`:`illiquid`].push(
				{account:document.getElementById(`data-entry-name`).value
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
						{account:document.getElementById(`data-entry-name`).value
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
	[`daysSinceLastTransfer`
	,`balanceAverage`
	,`interest`
	,`sumOfTransfers`
	,`sumOfInterest`
	,`sumOfAccounts`
	,`daysFromLastTransfer`]
function replacer(key,value){
	for(let i1=0;i1<UNNECESSARY_PROPERTIES.length;i1++){
		if(key===UNNECESSARY_PROPERTIES[i1])return undefined
	}
	return value
}
function downloadMemory(){
	if(!(loans.length+financialHoldings.liquid.length+financialHoldings.illiquid.length)){
		alert(`There is no data to save.`)
		return
	}
	const data={financialHoldings:financialHoldings,loans:loans}
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