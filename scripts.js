function closeLandingModal(){
	document.getElementById(`landingModal`).style=`animation:fadeOut .2s forwards,moveOutTop .2s;`
	document.getElementById(`content`).style=`animation:fadeIn .2s;`
}
function uploadFile(){
	closeLandingModal()
	// loadArrays()
}