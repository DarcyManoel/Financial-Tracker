function closeLandingModal(){
	document.getElementById(`landingModal`).style=`animation:fadeOut .2s forwards;`
	document.getElementById(`content`).style=`animation:fadeIn .2s;`
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
				transfersSum+=loans[i1].accounts[i2].transfers[i3].transfer+(interest*-1)
			}
			loans[i1].accounts[i2].transfersSum=parseFloat(transfersSum.toFixed(2))
			accountsSum+=transfersSum
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
	renderMenu(stage)
}
var loans=[]
function renderMenu(stage){
	if(loans.length){
		renderLoans(``,stage??0)
	}
}
var globalCounterpartyIndex=0
var globalAccountIndex=0
var open=0
function renderLoans(isOpen,stage,counterpartyIndex,accountIndex){
	if(counterpartyIndex+1)globalCounterpartyIndex=counterpartyIndex
	if(accountIndex+1)globalAccountIndex=accountIndex
	var colour
	var contentQueue=``
	if(isOpen){
		stage--
	}
	if(!stage){
		for(i1=0;i1<loans.length;i1++){
			colour=loans[i1].accountsSum>=0?`green`:`red`
			contentQueue+=`
				<details onClick="renderLoans(this.open,1,${i1})" style="color:${colour};" name="counterparty" ${open?`${i1==globalCounterpartyIndex?`open`:``}`:``}>
					<summary>
						<span>${loans[i1].counterparty}</span>
					</summary>
					${loans[i1].accountsSum>0?`$${numberWithCommas(loans[i1].accountsSum.toFixed(2))} <span>surplus</span>`:`${loans[i1].accountsSum<0?`$${numberWithCommas(Math.abs(loans[i1].accountsSum.toFixed(2)))} <span>outstanding</span>`:`settled`}`}
				</details>`
		}
		document.getElementById(`loansCounterparties`).innerHTML=contentQueue
		document.getElementById(`loansAccounts`).innerHTML=``
		document.getElementById(`loansAccountsSectionHeader`).innerHTML=`
			<span>ACCOUNTS</span>`
		document.getElementById(`loansTransfers`).innerHTML=``
		document.getElementById(`loansTransfersSectionHeader`).innerHTML=`
			<span>TRANSFERS</span>`
	}
	if(stage==1){
		document.getElementById(`loansAccountsSectionHeader`).innerHTML=`
			<span>ACCOUNTS</span>
			<span onClick="createLoanEntry('accounts',${globalCounterpartyIndex})" class="button" style="background-color:lightgray;border-radius:100%;padding:0 .4rem;">+</span>`
		for(i1=0;i1<loans[globalCounterpartyIndex].accounts.length;i1++){
			colour=loans[globalCounterpartyIndex].accounts[i1].transfersSum>=0?`green`:`red`
			contentQueue+=`
				<details onClick="renderLoans(this.open,2,${globalCounterpartyIndex},${i1})" style="color:${colour};" name="account" ${open?`${i1==globalAccountIndex?`open`:``}`:``}>
					<summary>
						<span>${loans[globalCounterpartyIndex].accounts[i1].title}</span>
					</summary>
					${loans[globalCounterpartyIndex].accounts[i1].transfersSum>0?`$${numberWithCommas(loans[globalCounterpartyIndex].accounts[i1].transfersSum.toFixed(2))} <span>surplus</span>`:`${loans[globalCounterpartyIndex].accounts[i1].transfersSum<0?`$${numberWithCommas(Math.abs(loans[globalCounterpartyIndex].accounts[i1].transfersSum.toFixed(2)))} <span>outstanding</span>`:`settled`}`}
					${loans[globalCounterpartyIndex].accounts[i1].interestRate?`<br>${loans[globalCounterpartyIndex].accounts[i1].interestRate*100}% <span>interest per annum</span>`:``}
				</details>`
		}
		document.getElementById(`loansAccounts`).innerHTML=contentQueue
		document.getElementById(`loansTransfers`).innerHTML=``
		document.getElementById(`loansTransfersSectionHeader`).innerHTML=`
			<span>TRANSFERS</span>`
	}else if(stage==2){
		document.getElementById(`loansTransfersSectionHeader`).innerHTML=`
			<span>TRANSFERS</span>
			<span onClick="createLoanEntry('transfers',${globalCounterpartyIndex},${globalAccountIndex})" class="button" style="background-color:lightgray;border-radius:100%;padding:0 .4rem;">+</span>`
		for(i1=0;i1<loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers.length;i1++){
			colour=loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer>=0?`green`:`red`
			contentQueue+=`
				<details style="color:${colour};">
					<summary>
						<span>${loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].date.join(`-`)}</span>
					</summary>
					${loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer.toFixed(2)>0?`+$${numberWithCommas(loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer.toFixed(2))}`:`-$${numberWithCommas(Math.abs(loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].transfer).toFixed(2))}`}
					${loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].period?`<br><span>${loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].period} days from last transfer</span>`:``}
					${loans[globalCounterpartyIndex].accounts[globalAccountIndex].interestRate?`<br><span>${loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].interest?numberWithCommas(loans[globalCounterpartyIndex].accounts[globalAccountIndex].transfers[i1].interest.toFixed(2)):``}</span>`:``}
				</details>`
		}
		document.getElementById(`loansTransfers`).innerHTML=contentQueue
	}
	open=0
}
function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g,`,`);
}
var isMemoryChanged=0
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
	if(!loans.length)alert(`There is no data to save.`);return
	const arrayedDate=new Date().toISOString().replaceAll(`T`,`-`).replaceAll(`:`,`-`).split(`.`)[0].split(`-`)
	const filename=`financials(${arrayedDate[0]}y_${arrayedDate[1]}mo_${arrayedDate[2]}d_${arrayedDate[3]}h_${arrayedDate[4]}mi_${arrayedDate[5]}s).js`
	const content=`loans=${JSON.stringify(loans,null,`\t`)}\n`
	const file=new Blob([content],{type:`text/plain`})
	const link=document.createElement(`a`)
	link.href=URL.createObjectURL(file)
	link.download=filename
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(link.href)
}