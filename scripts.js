const HTML_MODAL={
	landing:`
		<h1>Welcome!</h1>
		This webpage allows you to track your financial situation, offering a comprehensive view of your income, expenses, and savings. With intuitive tools and real-time insights, you can make informed decisions to stay on top of your finances.
		<br>
		<br>
		To begin, you can close this dialogue or upload a file to resume previously made progress.
		<h3 style="display:flex;gap:.5rem;justify-content:center;">
			<div onClick="closeLandingModal()" class="button button-close">
				Close
			</div>
			<div class="button button-continue">
				<label for="file-input">
					Upload File
				</label>
			</div>
		</h3>
		<hr>
		<div class="modal-footnotes">
			psst..
			<h6>
				the uploaded file should be a .json file formatted by this site previously.
			</h6>
		</div>`}
document.getElementById(`modal`).innerHTML=HTML_MODAL.landing
function closeLandingModal(){
	document.getElementById(`modal`).style=`animation:fade-out .2s forwards;`
	document.getElementById(`content`).style=`animation:fade-in .2s;`
	changeContent()}
let data={
	funds:{
		liquid:[],
		illiquid:[]},
	loans:[]}
function uploadFile(file){
	closeLandingModal()
	let files=event.target.files
	let fileReader=new FileReader()
	fileReader.readAsText(files[0])
	fileReader.onload=function(e){
		data=JSON.parse(e.target.result)
		processData()}}
function processData(stage){
	let pointer
	//	funds
	pointer=`funds`
	for(const[key,value]of Object.entries(data[pointer])){
		for(let i1=0;i1<data[pointer][key].length;i1++){
			data[pointer][key][i1].records=data[pointer][key][i1].records.sort(function(a,b){return a.date.join(``)-b.date.join(``)})
			data[pointer][key][i1].daysSinceLastTransfer=Math.round((new Date(data[pointer][key][i1].records[data[pointer][key][i1].records.length-1].date.join(`/`))-new Date(data[pointer][key][i1].records[0].date.join(`/`)))/86400000)
			data[pointer][key][i1].records[0].daysSinceLastTransfer=0
			let balanceAverage=data[pointer][key][i1].records[0].balance
			for(let i2=1;i2<data[pointer][key][i1].records.length;i2++){
				data[pointer][key][i1].records[i2].daysSinceLastTransfer=Math.round((new Date(data[pointer][key][i1].records[i2].date.join(`/`))-new Date(data[pointer][key][i1].records[i2-1].date.join(`/`)))/86400000)
				balanceAverage+=data[pointer][key][i1].records[i2].balance}
			data[pointer][key][i1].balanceAverage=balanceAverage/data[pointer][key][i1].records.length}}
	//	loans
	pointer=`loans`
	for(let i1=0;i1<data[pointer].length;i1++){
		let sumOfAccounts=0
		for(let i2=0;i2<data[pointer][i1].accounts.length;i2++){
			let sumOfTransfers=0
			let sumOfInterest=0
			for(let i3=0;i3<data[pointer][i1].accounts[i2].transfers.length;i3++){
				data[pointer][i1].accounts[i2].transfers[i3].date[1]=String(data[pointer][i1].accounts[i2].transfers[i3].date[1]).padStart(2,`0`)
				data[pointer][i1].accounts[i2].transfers[i3].date[2]=String(data[pointer][i1].accounts[i2].transfers[i3].date[2]).padStart(2,`0`)
				if(i3>0){
					data[pointer][i1].accounts[i2].transfers[i3].daysSinceLastTransfer=Math.round((new Date(data[pointer][i1].accounts[i2].transfers[i3].date.join(`/`))-new Date(data[pointer][i1].accounts[i2].transfers[i3-1].date.join(`/`)))/86400000)
					if(data[pointer][i1].accounts[i2].interestRate){
						const BALANCE=(sumOfTransfers-sumOfInterest)*-1
						const INTEREST_RATE_PER_DAY=data[pointer][i1].accounts[i2].interestRate/365
						const TIME_BETWEEN_TRANSFERS=data[pointer][i1].accounts[i2].transfers[i3].daysSinceLastTransfer
						if(BALANCE>=0)
							sumOfInterest+=data[pointer][i1].accounts[i2].transfers[i3].interest=BALANCE*(1+INTEREST_RATE_PER_DAY)**TIME_BETWEEN_TRANSFERS-BALANCE}}
				sumOfTransfers+=data[pointer][i1].accounts[i2].transfers[i3].transfer}
			if(data[pointer][i1].accounts[i2].interestRate&&data.loans[i1].accounts[i2].transfers.length){
				const BALANCE=(sumOfTransfers-sumOfInterest)*-1
				const TIME_SINCE_LAST_TRANSFER=Math.round((new Date()-new Date(data[pointer][i1].accounts[i2].transfers[data[pointer][i1].accounts[i2].transfers.length-1].date.join(`/`)))/86400000)
				if(BALANCE>=0)
					sumOfInterest+=data[pointer][i1].accounts[i2].transfers[i3].interest=BALANCE*(1+INTEREST_RATE_PER_DAY)**TIME_SINCE_LAST_TRANSFER-BALANCE}
			data[pointer][i1].accounts[i2].sumOfTransfers=parseFloat(sumOfTransfers)
			data[pointer][i1].accounts[i2].sumOfInterest=parseFloat(sumOfInterest)
			sumOfAccounts+=sumOfTransfers-sumOfInterest}
		data[pointer][i1].sumOfAccounts=parseFloat(sumOfAccounts)}
	if(globalCounterpartyIndex){
		let GLOBAL_COUNTERPARTY_NAME=data[pointer][globalCounterpartyIndex].counterparty
		loans=data[pointer].sort(function(a,b){return a.sumOfAccounts-b.sumOfAccounts})
		globalCounterpartyIndex=data[pointer].findIndex(counterparties=>counterparties.counterparty===GLOBAL_COUNTERPARTY_NAME)
		if(globalAccountIndex){
			let GLOBAL_ACCOUNT_TITLE=data[pointer][globalCounterpartyIndex].accounts[globalAccountIndex].account
			for(let i1=0;i1<data[pointer].length;i1++)
				data[pointer][i1].accounts=data[pointer][i1].accounts.sort(function(a,b){return a.sumOfTransfers-b.sumOfTransfers})
			globalAccountIndex=data[pointer][globalCounterpartyIndex].accounts.findIndex(accounts=>accounts.account===GLOBAL_ACCOUNT_TITLE)}}
	//
	renderContent(stage)}
function renderContent(stage){
	switch(selectedContentArea){
		case `Funds`:
			renderFinancialHoldings()
			break
		case `Loans`:
			renderLoans(``,stage??0)
			break}
}
const KEBABISE=(camelString)=>camelString.replace(/[A-Z]+(?![a-z])|[A-Z]/g,($,insert)=>(insert?`-`:``)+$.toLowerCase())
function renderFinancialHoldings(){
	let pointer
	let contentQueue
	//	funds
	pointer=`funds`
	const DATE_TODAY=new Date(`${new Date().getFullYear()}/${new Date().getMonth()+1}/${new Date().getDate()}`)
	for(const[key,value]of Object.entries(data[pointer])){
		contentQueue=``
		for(let i1=0;i1<data[pointer][key].length;i1++){
			const ACCOUNT_RECORDS=data[pointer][key][i1].records
			const DAYS_SINCE_UPDATE=(DATE_TODAY-new Date(ACCOUNT_RECORDS[ACCOUNT_RECORDS.length-1].date.join(`/`)))/86400000
			const COLOUR=DAYS_SINCE_UPDATE>0
				?`red`
				:`green`
			const ACCOUNT=data[pointer][key][i1].account
			const BALANCE=numberWithCommas(ACCOUNT_RECORDS[ACCOUNT_RECORDS.length-1].balance)
			const LAST_UPDATED=DAYS_SINCE_UPDATE>0
				?`${DAYS_SINCE_UPDATE>1
					?`${DAYS_SINCE_UPDATE} days ago`
					:`yesterday`}`
				:`today`
			contentQueue+=`
				<details name="${pointer}" style="color:${COLOUR};">
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
		document.getElementById(`${KEBABISE(pointer)}-${key}`).innerHTML=contentQueue
		for(let i1=0;i1<data[pointer][key].length;i1++)
			drawSparkline(`sparkline${data[pointer][key][i1].account}`,data[pointer][key][i1].records,data[pointer][key][i1].daysSinceLastTransfer,data[pointer][key][i1].balanceAverage)}
	//	loans
	pointer=`loans`
	contentQueue=``
	if(data[pointer].length){
		let loansTotal=0
		for(let i1=0;i1<data[pointer].length;i1++)
			loansTotal+=data[pointer][i1].sumOfAccounts
		const BALANCE=loansTotal<=0
			?`$${numberWithCommas(Math.abs(loansTotal).toFixed(2))}`
			:`<span style="color:red;">-$${numberWithCommas(Math.abs(loansTotal).toFixed(2))}</span>`
		contentQueue+=`
			<details name="funds" style="color:green;">
				<summary>
					<span>Loans</span>
				</summary>
				${BALANCE}
				<br>
				<span>updated</span> automatically
			</details>`}
	document.getElementById(`funds-intangible`).innerHTML=contentQueue}
function drawSparkline(canvasId,dataPoints,daysSinceLastTransfer,balanceAverage){
	let canvas=document.getElementById(canvasId)
	let canvasContext=canvas.getContext(`2d`)
	canvasContext.clearRect(0,0,canvas.width,canvas.height)
	const maxValue=dataPoints.reduce(function(prev,current){
		return(prev&&prev.balance>current.balance)
			?prev
			:current})
	const minValue=dataPoints.reduce(function(prev,current){
		return(prev&&prev.balance<current.balance)
			?prev
			:current})
	const yScale=(canvas.height-2)/(maxValue.balance-minValue.balance)
	const xScale=(canvas.width-2)/(daysSinceLastTransfer)
	canvasContext.beginPath()
	canvasContext.moveTo(1,canvas.height-(dataPoints[0].balance-minValue.balance)*yScale)
	let daysSinceLastTransferAccrued=0
	for(let i1=1;i1<dataPoints.length;i1++){
		daysSinceLastTransferAccrued+=dataPoints[i1].daysSinceLastTransfer
		const X=daysSinceLastTransferAccrued*xScale+1
		const Y=canvas.height-(dataPoints[i1].balance-minValue.balance)*yScale
		canvasContext.lineTo(X,Y)}
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
	canvasContext.stroke()}
let globalCounterpartyIndex
let globalAccountIndex
let open=0
function renderLoans(isOpen,stage,counterpartyIndex,accountIndex){
	if(counterpartyIndex+1)globalCounterpartyIndex=counterpartyIndex
	if(accountIndex+1)globalAccountIndex=accountIndex
	let pointer
	let contentQueue=` `
	if(isOpen)
		stage--
	//	counterparties
	pointer=`loans`
	if(!stage){
		const OPEN_IF_SELECTED_COUNTERPARTY=(index)=>{
			return (open&&index==globalCounterpartyIndex)
				?`open`
				:``}
		for(let i1=0;i1<data[pointer].length;i1++){
			const FUNCTION_ON_CLICK=`renderLoans(this.open,1,${i1})`
			const COLOUR=data[pointer][i1].sumOfAccounts>=0
				?`green`
				:`red`
			const COUNTERPARTY=data[pointer][i1].counterparty
			const BALANCE_REMAINING_INDICATION=data[pointer][i1].sumOfAccounts>=0
				?`<span>surplus</span><br>`
				:`<span>outstanding</span><br>`
			const BALANCE_REMAINING=`$${numberWithCommas(Math.abs(data[pointer][i1].sumOfAccounts).toFixed(2))} ${BALANCE_REMAINING_INDICATION}`
			contentQueue+=`
				<details onClick="${FUNCTION_ON_CLICK}" name="counterparty" ${OPEN_IF_SELECTED_COUNTERPARTY(i1)} style="color:${COLOUR};">
					<summary>
						<span>${COUNTERPARTY}</span>
					</summary>
					${BALANCE_REMAINING}
				</details>`}
		document.getElementById(`${pointer}-counterparties`).innerHTML=contentQueue
		document.getElementById(`${pointer}-accounts`).innerHTML=``
		document.getElementById(`${pointer}-accounts-header`).innerHTML=`
			<span>ACCOUNTS</span>`
		document.getElementById(`${pointer}-transfers`).innerHTML=``
		document.getElementById(`${pointer}-transfers-header`).innerHTML=`
			<span>TRANSFERS</span>`}
	//	accounts
	if(stage==1){
		document.getElementById(`${pointer}-accounts-header`).innerHTML=`
			<span>ACCOUNTS</span>
			<span onClick="createEntry('${pointer}','accounts',${globalCounterpartyIndex})" class="button create-entry">+</span>`
		const OPEN_IF_SELECTED_ACCOUNT=(index)=>{
			return (open&&index==globalAccountIndex)
				?`open`
				:``}
		for(let i1=0;i1<data[pointer][globalCounterpartyIndex].accounts.length;i1++){
			const FUNCTION_ON_CLICK=`renderLoans(this.open,2,${globalCounterpartyIndex},${i1})`
			const COLOUR=data[pointer][globalCounterpartyIndex].accounts[i1].sumOfTransfers>=0
				?`green`
				:`red`
			const ACCOUNT=data[pointer][globalCounterpartyIndex].accounts[i1].account
			const INTEREST_RATE=data[pointer][globalCounterpartyIndex].accounts[i1].interestRate
				?`${data[pointer][globalCounterpartyIndex].accounts[i1].interestRate*100}% <span>interest per annum</span><br>`
				:``
			const BALANCE_REMAINING_INDICATION=(data[pointer][globalCounterpartyIndex].accounts[i1].sumOfTransfers-data[pointer][globalCounterpartyIndex].accounts[i1].sumOfInterest)>=0
				?`<span>surplus</span><br>`
				:`<span>outstanding</span><br>`
			const BALANCE_REMAINING=`$${numberWithCommas(Math.abs(data[pointer][globalCounterpartyIndex].accounts[i1].sumOfTransfers-data[pointer][globalCounterpartyIndex].accounts[i1].sumOfInterest).toFixed(2))} ${BALANCE_REMAINING_INDICATION}`
			contentQueue+=`
				<details onClick="${FUNCTION_ON_CLICK}" name="account" ${OPEN_IF_SELECTED_ACCOUNT(i1)} style="color:${COLOUR};">
					<summary>
						<span>${ACCOUNT}</span>
					</summary>
					${INTEREST_RATE}
					${BALANCE_REMAINING}
				</details>`}
		document.getElementById(`${pointer}-accounts`).innerHTML=contentQueue
		document.getElementById(`${pointer}-transfers`).innerHTML=``
		document.getElementById(`${pointer}-transfers-header`).innerHTML=`
			<span>TRANSFERS</span>`}
	//	transfers
	else if(stage==2){
		document.getElementById(`${pointer}-transfers-header`).innerHTML=`
			<span>TRANSFERS</span>
			<span onClick="createEntry('${pointer}','transfers',${globalCounterpartyIndex},${globalAccountIndex})" class="button create-entry">+</span>`
		for(let i1=0;i1<data[pointer][globalCounterpartyIndex].accounts[globalAccountIndex].transfers.length;i1++){
			const COLOUR=data[pointer][globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer>=0
				?`green`
				:`red`
			const FORMATTED_DATE=data[pointer][globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].date.join(`-`)
			const TRANSFER=`${data[pointer][globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer>=0?`+`:`-`}$${numberWithCommas(Math.abs(data[pointer][globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer))}`
			const DAYS_SINCE_LAST_TRANSFER_FORMATTED=data[pointer][globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].daysSinceLastTransfer
				?`<br><span>${data[pointer][globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].daysSinceLastTransfer} days from last transfer</span>`
				:``
			const INTEREST_ACCRUED=(data[pointer][globalCounterpartyIndex].accounts[globalAccountIndex].interestRate&&data[pointer][globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].interest)
				?`<br><span style="color:red;">$${numberWithCommas(data[pointer][globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].interest.toFixed(2))}</span> <span>interest accrued</span>`
				:``
			contentQueue+=`
				<details style="color:${COLOUR};">
					<summary>
						<span>${FORMATTED_DATE}</span>
					</summary>
					${TRANSFER}
					${DAYS_SINCE_LAST_TRANSFER_FORMATTED}
					${INTEREST_ACCRUED}
				</details>`}
		document.getElementById(`${pointer}-transfers`).innerHTML=contentQueue}
	//
	open=0}
const CONTENT_SECTION={
	Funds:`
		<div class="card wrapper">
			<h3 id="funds-liquid-header" class="header">
				<span>Liquid</span>
				<span onClick="createEntry('funds','liquid')" class="button create-entry">+</span>
			</h3>
			<div id="funds-liquid"></div>
		</div>
		<div class="card wrapper">
			<h3 id="funds-illiquid-header" class="header">
				<span>Illiquid</span>
				<span onClick="createEntry('funds','illiquid')" class="button create-entry">+</span>
			</h3>
			<div id="funds-illiquid"></div>
		</div>
		<div class="card wrapper">
			<h3 id="funds-intangible-header" class="header">
				<span>Intangible</span>
			</h3>
			<div id="funds-intangible" fade-if-empty></div>
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
document.getElementById(`tracking-sections`).innerHTML=`<option>${Object.keys(CONTENT_SECTION).join(`</option><option>`)}</option`
function changeContent(){
	const CURRENT_CONTENT=document.getElementById(`tracking-sections`).value
	document.getElementById(`content-inner`).innerHTML=CONTENT_SECTION[CURRENT_CONTENT]
	selectedContentArea=CURRENT_CONTENT
	renderContent()}
function numberWithCommas(x){
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g,`,`)}
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
			</span>`}}
let isMemoryChanged=0
function createEntry(sectionMajor,sectionMinor,counterpartyIndex,accountIndex){
	document.getElementById(`page-cover`).classList.add(`cover`)
	document.getElementById(`modal`).style=`animation:fade-in .2s forwards;`
	switch(sectionMajor){
		case `funds`:
			document.getElementById(`modal`).innerHTML=`
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
			document.getElementById(`modal`).innerHTML=`
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
			break}}
function testValidity(elementID){
	if(document.getElementById(elementID).value.length)
		document.getElementById(`${elementID}-wrapper`).setAttribute(`data-before`,``)
	else
		document.getElementById(`${elementID}-wrapper`).setAttribute(`data-before`,`!`)}
function closeDataEntry(){
	document.getElementById(`page-cover`).classList.remove(`cover`)
	document.getElementById(`modal`).style=`animation:fade-out .2s forwards;`}
function submitData(sectionMajor,sectionMinor){
	let stage
	switch(sectionMajor){
		case `funds`:
			if(!document.getElementById(`data-entry-name`).value.length)return
			if(!document.getElementById(`data-entry-value`).value.length)return
			if(!document.getElementById(`data-entry-value-date`).value.length)return
			for(let i1=0;i1<data[sectionMajor][sectionMinor].length;i1++)
				if(document.getElementById(`data-entry-name`).value==data[sectionMajor][sectionMinor][i1].account){
					data[sectionMajor][sectionMinor][i1].records=data[sectionMajor][sectionMinor][i1].records.filter(record=>record.date.join(`-`)!=document.getElementById(`data-entry-value-date`).value)
					data[sectionMajor][sectionMinor][i1].records.push(
						{date:document.getElementById(`data-entry-value-date`).value.split(`-`)
						,balance:parseFloat(document.getElementById(`data-entry-value`).value)})
					closeDataEntry()
					isMemoryChanged=1
					processData()
					return}
			data[sectionMajor][sectionMinor==`liquid`?`liquid`:`illiquid`].push(
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
					data[sectionMajor].push(
						{counterparty:document.getElementById(`data-entry-name`).value
						,accounts:[]})
					break
				case `accounts`:
					stage=1
					if(!document.getElementById(`data-entry-name`).value.length)return
					if(!/^[0-9]+(\.[0-9]{1,2})?$/.test(document.getElementById(`data-entry-interest`).value))return
					data[sectionMajor][globalCounterpartyIndex].accounts.push(
						{account:document.getElementById(`data-entry-name`).value
						,interestRate:document.getElementById(`data-entry-interest`).value/100
						,transfers:[]})
					break
				case `transfers`:
					stage=2
					if(!document.getElementById(`data-entry-value`).value.length)return
					if(!document.getElementById(`data-entry-value-date`).value.length)return
					data[sectionMajor][globalCounterpartyIndex].accounts[globalAccountIndex].transfers.push(
						{date:document.getElementById(`data-entry-value-date`).value.split(`-`)
						,transfer:parseFloat(document.getElementById(`data-entry-value`).value)})
					open=1
					processData(0)
					open=1
					processData(1)
					break}
			break}
	closeDataEntry()
	isMemoryChanged=1
	processData(stage??``)}
window.onbeforeunload=function(){
	if(isMemoryChanged)return``}
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
			return`th`}}
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
	for(let i1=0;i1<UNNECESSARY_PROPERTIES.length;i1++)
		if(key===UNNECESSARY_PROPERTIES[i1])return undefined
	return value}
function downloadMemory(){
	if(!
		(data.loans.length
		+data.funds.liquid.length
		+data.funds.illiquid.length)){
			alert(`There is no data to save.`)
			return}
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
	isMemoryChanged=0}