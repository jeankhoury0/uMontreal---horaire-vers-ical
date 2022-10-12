// ==UserScript==
// @name         Export to Ical
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Export the UMontreal Calendar to Ical
// @author       jeankhoury0
// @match        https://academique-dmz.synchro.umontreal.ca/psc/acprpr9/EMPLOYEE/SA/c/SA_LEARNER_SERVICES.SSR_SSENRL_LIST.GBL*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=umontreal.ca
// @grant        none
// ==/UserScript==


/**
 * Open the PRINTABLE schedule in the list
 */
// start point

(function () {
	createAButton()

})();


// START ON BUTTON CLICK
function generateTheScheduleAction() {
	var allTheCoursesArr = []
	var CoursesRow = document.querySelector(".PABACKGROUNDINVISIBLE").children[0].children
	for (var i = 0; i < CoursesRow.length; i++) {
		allTheCoursesArr.push(
			getCourseInformation(CoursesRow[i], i)
		)
	}

	var cal = generateTheCalendar(allTheCoursesArr)
	console.log(cal)
	
	var user = document.querySelector(".gh-username").innerText
	cal.download(`${user} calendrier ${Date.now()}`)


	console.log(allTheCoursesArr)
}



// create a button

function createAButton() {
	var body_of_page = document.querySelector("body")
	var button_content = document.createElement("div")
	button_content.innerHTML = (`
	<div style="position: fixed; bottom: 5%; right: 5%; z-index:1000;">
		<p>Utiliser "Page Imprimable" <br> au bas de l'écran </p>
		<button id="tm-button-generate"> Generate Schedule</button>
	</div>

	<style >
		#tm-button-generate{
			background-color: #5CC2E7;   
			color: white;
			border: none;
			font-weight: bold;
			padding: 2em; 
		}

		#tm-button-generate:hover{
			background-color:#006BB6;
		}
	</style>
	`)
	body_of_page.append(button_content)
	document.querySelector("#tm-button-generate").addEventListener("click", generateTheScheduleAction, false)
}


// Extract the course info

function getCourseInformation(tabularInfoOfCourse, coursePosition) {
	var course = {}

	course.title = tabularInfoOfCourse.querySelector(".ui-bar").innerText

	var tabularInfoOfTime = document.querySelector(".PABACKGROUNDINVISIBLE").children[0].children[2].querySelectorAll(".PSLEVEL2GRIDWBO")[1]
	course.time = getTimeInformation(tabularInfoOfTime, coursePosition)
	return course
}

function getTimeInformation(tabularInfoOfTime, coursePosition) {
	// generate an ID trUMET_CLS_EXM_VW$1_row1
	var rowCounter = 1 // firstPositionInTheCode
	var oldVolet = null // the volet that was the previous row

	var getTimeInformationArr = []

	while (document.querySelector(`[id="${getRowTimeId(coursePosition, rowCounter)}"]`)) {
		var currentRow = document.querySelector(`[id="${getRowTimeId(coursePosition, rowCounter)}"]`)
		rowCounter += 1
		var res = processIndividualTimeRow(currentRow, oldVolet)
		oldVolet = res?.volet
		getTimeInformationArr.push(res)
	}
	return getTimeInformationArr

}

function processIndividualTimeRow(currentRow, oldVolet) {
	// return an object
	var attr = currentRow.innerText.replaceAll("\n", "").split("\t")
	var res = ({
		volet: attr[2] || oldVolet,
		start_time: getStartTime(attr[3]),
		end_time: getEndTime(attr[3]),
		recuring_day: getRecurringDay(attr[3]),
		start_date: getStartDate(attr[6]),
		end_date: getEndDate(attr[6]),
		location: attr[4],
		teacher: attr[5]

	})
	return (res)
}

function getStartTime(row) {
	var time = row.split(" ")[1]
	// edge case when is full day
	if (row == "À communiquer") {
		return "00:00 am" 
	}
	return tConvert(time)
}

function getEndTime(row) {
	var time = row.split(" ")[3]
	// edge case when is full day
	if (row == "À communiquer") {
		return "00:00 am" // TODO: might be a bug, need to investigate how to do full day
	}
	return tConvert(time)
}

function getRecurringDay(row) {
	var day = row.split(" ")[0]
	if (row == "À communiquer") {
		return "Monday" // TODO: placeholder
	}

	//SU, MO, TU, WE, TH, FR, SA
	switch (day.toLowerCase()) {
		case "lun":
			return "MO"
		case "ma":
			return "TU"
		case "mer":
			return "WE"
		case "j":
			return "TH"
		case "v":
			return "FR"
		case "s": //not sure
			return "SA"
		case "d":
			return "SU" // not sure
		default:
			log.warn(`${day} is not recognized as a valid day, this might be due to a change of name in the student center, please open an issue`)
			log.warn("will be assuming the day to be SA")
			return "SA"
	}
}

function getStartDate(row) {
	res = row.split("-")[0].trim()
	return res
}

function getEndDate(row) {
	// if single date
	if (row.split("-").length == 1) {
		return row 
	}
	return row.split("-")[1].trim()
}



function getRowTimeId(coursePosition, rowCounter) {
	return `trUMET_CLS_EXM_VW$${coursePosition}_row${rowCounter}`
}



function generateTheCalendar(calendarObj){
	var cal = ics()
	calendarObj.forEach(c => {
		c.time.forEach(time => {
			cal.addEvent(
				`[${time.volet}] ${c.title}`,
				"",
				time.location,
				`${time.start_date} ${time.start_time}`,
				`${time.start_date} ${time.end_time}`,
				{
					freq: "WEEKLY",
					interval: 1,
					until: time.end_date,
					byday: [time.recuring_day]
				}

		)
		})
	})
	console.log(cal.calendar())
	console.log(cal.events())
	return cal
}


function tConvert (time) {
	// Check correct time format and split into components
	time = time.toString().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
  
	if (time.length > 1) { // If time format correct
	  time = time.slice (1);  // Remove full string match value
	  time[5] = +time[0] < 12 ? ' am' : ' pm'; // Set AM/PM
	  time[0] = +time[0] % 12 || 12; // Adjust hours
	}
	return time.join (''); // return adjusted time or original string
  }




class JCalendar{

}

/*! ics.js Wed Sept 14 2017 */
var ics=function(e,t){"use strict";{if(!(navigator.userAgent.indexOf("MSIE")>-1&&-1==navigator.userAgent.indexOf("MSIE 10"))){void 0===e&&(e="default"),void 0===t&&(t="Calendar");var r=-1!==navigator.appVersion.indexOf("Win")?"\r\n":"\n",n=[],i=["BEGIN:VCALENDAR","PRODID:"+t,"VERSION:2.0"].join(r),o=r+"END:VCALENDAR",a=["SU","MO","TU","WE","TH","FR","SA"];return{events:function(){return n},calendar:function(){return i+r+n.join(r)+o},addEvent:function(t,i,o,l,u,s){if(void 0===t||void 0===i||void 0===o||void 0===l||void 0===u)return!1;if(s&&!s.rrule){if("YEARLY"!==s.freq&&"MONTHLY"!==s.freq&&"WEEKLY"!==s.freq&&"DAILY"!==s.freq)throw"Recurrence rrule frequency must be provided and be one of the following: 'YEARLY', 'MONTHLY', 'WEEKLY', or 'DAILY'";if(s.until&&isNaN(Date.parse(s.until)))throw"Recurrence rrule 'until' must be a valid date string";if(s.interval&&isNaN(parseInt(s.interval)))throw"Recurrence rrule 'interval' must be an integer";if(s.count&&isNaN(parseInt(s.count)))throw"Recurrence rrule 'count' must be an integer";if(void 0!==s.byday){if("[object Array]"!==Object.prototype.toString.call(s.byday))throw"Recurrence rrule 'byday' must be an array";if(s.byday.length>7)throw"Recurrence rrule 'byday' array must not be longer than the 7 days in a week";s.byday=s.byday.filter(function(e,t){return s.byday.indexOf(e)==t});for(var c in s.byday)if(a.indexOf(s.byday[c])<0)throw"Recurrence rrule 'byday' values must include only the following: 'SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'"}}var g=new Date(l),d=new Date(u),f=new Date,S=("0000"+g.getFullYear().toString()).slice(-4),E=("00"+(g.getMonth()+1).toString()).slice(-2),v=("00"+g.getDate().toString()).slice(-2),y=("00"+g.getHours().toString()).slice(-2),A=("00"+g.getMinutes().toString()).slice(-2),T=("00"+g.getSeconds().toString()).slice(-2),b=("0000"+d.getFullYear().toString()).slice(-4),D=("00"+(d.getMonth()+1).toString()).slice(-2),N=("00"+d.getDate().toString()).slice(-2),h=("00"+d.getHours().toString()).slice(-2),I=("00"+d.getMinutes().toString()).slice(-2),R=("00"+d.getMinutes().toString()).slice(-2),M=("0000"+f.getFullYear().toString()).slice(-4),w=("00"+(f.getMonth()+1).toString()).slice(-2),L=("00"+f.getDate().toString()).slice(-2),O=("00"+f.getHours().toString()).slice(-2),p=("00"+f.getMinutes().toString()).slice(-2),Y=("00"+f.getMinutes().toString()).slice(-2),U="",V="";y+A+T+h+I+R!=0&&(U="T"+y+A+T,V="T"+h+I+R);var B,C=S+E+v+U,j=b+D+N+V,m=M+w+L+("T"+O+p+Y);if(s)if(s.rrule)B=s.rrule;else{if(B="rrule:FREQ="+s.freq,s.until){var x=new Date(Date.parse(s.until)).toISOString();B+=";UNTIL="+x.substring(0,x.length-13).replace(/[-]/g,"")+"000000Z"}s.interval&&(B+=";INTERVAL="+s.interval),s.count&&(B+=";COUNT="+s.count),s.byday&&s.byday.length>0&&(B+=";BYDAY="+s.byday.join(","))}(new Date).toISOString();var H=["BEGIN:VEVENT","UID:"+n.length+"@"+e,"CLASS:PUBLIC","DESCRIPTION:"+i,"DTSTAMP;VALUE=DATE-TIME:"+m,"DTSTART;VALUE=DATE-TIME:"+C,"DTEND;VALUE=DATE-TIME:"+j,"LOCATION:"+o,"SUMMARY;LANGUAGE=en-us:"+t,"TRANSP:TRANSPARENT","END:VEVENT"];return B&&H.splice(4,0,B),H=H.join(r),n.push(H),H},download:function(e,t){if(n.length<1)return!1;t=void 0!==t?t:".ics",e=void 0!==e?e:"calendar";var a,l=i+r+n.join(r)+o;if(-1===navigator.userAgent.indexOf("MSIE 10"))a=new Blob([l]);else{var u=new BlobBuilder;u.append(l),a=u.getBlob("text/x-vCalendar;charset="+document.characterSet)}return saveAs(a,e+t),l},build:function(){return!(n.length<1)&&i+r+n.join(r)+o}}}console.log("Unsupported Browser")}};

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
var saveAs=saveAs||(navigator.msSaveOrOpenBlob&&navigator.msSaveOrOpenBlob.bind(navigator))||(function(h){"use strict";var r=h.document,l=function(){return h.URL||h.webkitURL||h},e=h.URL||h.webkitURL||h,n=r.createElementNS("http://www.w3.org/1999/xhtml","a"),g=!h.externalHost&&"download" in n,j=function(t){var s=r.createEvent("MouseEvents");s.initMouseEvent("click",true,false,h,0,0,0,0,0,false,false,false,false,0,null);t.dispatchEvent(s)},o=h.webkitRequestFileSystem,p=h.requestFileSystem||o||h.mozRequestFileSystem,m=function(s){(h.setImmediate||h.setTimeout)(function(){throw s},0)},c="application/octet-stream",k=0,b=[],i=function(){var t=b.length;while(t--){var s=b[t];if(typeof s==="string"){e.revokeObjectURL(s)}else{s.remove()}}b.length=0},q=function(t,s,w){s=[].concat(s);var v=s.length;while(v--){var x=t["on"+s[v]];if(typeof x==="function"){try{x.call(t,w||t)}catch(u){m(u)}}}},f=function(t,u){var v=this,B=t.type,E=false,x,w,s=function(){var F=l().createObjectURL(t);b.push(F);return F},A=function(){q(v,"writestart progress write writeend".split(" "))},D=function(){if(E||!x){x=s(t)}if(w){w.location.href=x}else{window.open(x,"_blank")}v.readyState=v.DONE;A()},z=function(F){return function(){if(v.readyState!==v.DONE){return F.apply(this,arguments)}}},y={create:true,exclusive:false},C;v.readyState=v.INIT;if(!u){u="download"}if(g){x=s(t);n.href=x;n.download=u;j(n);v.readyState=v.DONE;A();return}if(h.chrome&&B&&B!==c){C=t.slice||t.webkitSlice;t=C.call(t,0,t.size,c);E=true}if(o&&u!=="download"){u+=".download"}if(B===c||o){w=h}if(!p){D();return}k+=t.size;p(h.TEMPORARY,k,z(function(F){F.root.getDirectory("saved",y,z(function(G){var H=function(){G.getFile(u,y,z(function(I){I.createWriter(z(function(J){J.onwriteend=function(K){w.location.href=I.toURL();b.push(I);v.readyState=v.DONE;q(v,"writeend",K)};J.onerror=function(){var K=J.error;if(K.code!==K.ABORT_ERR){D()}};"writestart progress write abort".split(" ").forEach(function(K){J["on"+K]=v["on"+K]});J.write(t);v.abort=function(){J.abort();v.readyState=v.DONE};v.readyState=v.WRITING}),D)}),D)};G.getFile(u,{create:false},z(function(I){I.remove();H()}),z(function(I){if(I.code===I.NOT_FOUND_ERR){H()}else{D()}}))}),D)}),D)},d=f.prototype,a=function(s,t){return new f(s,t)};d.abort=function(){var s=this;s.readyState=s.DONE;q(s,"abort")};d.readyState=d.INIT=0;d.WRITING=1;d.DONE=2;d.error=d.onwritestart=d.onprogress=d.onwrite=d.onabort=d.onerror=d.onwriteend=null;h.addEventListener("unload",i,false);return a}(self));