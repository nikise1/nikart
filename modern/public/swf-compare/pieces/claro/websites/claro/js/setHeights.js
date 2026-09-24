var windowSet = false;
var winW = 0;
var winH = 0;

var minWidthOn = true;
var minWidth = 900;

var minHeightOn = true;
var minHeight = 570;

var scrollableMargin = false;
var sWinH = 0;
var sWinW = 0;

var scrollOn = true;
var scrollPageTo = 'bottom';

var isRatio = false;
var rWinW = 8;
var rWinH = 5;

var setWinW = minWidth;
var setWinH = minHeight;

addLoadListener(initWindow);

//checks for page resize
function initWindow(){
	window.onresize = function()
	{
		getPageSize();
		setRatio();
		if(minHeightOn)
		{
			if(winH > minHeight){
				setWinH = winH;
			}
		}
		if(minWidthOn)
		{
			if(winW > minWidth){
				setWinW = winW;
			}	
		}
		setElements();
		scrollPage();	
	};
	window.onresize();
	return true;
}

function setElements(){
	//add item here with id, and offset, and the dom object we are updating
	var toChangeID = [
		['flash' , 0, ['height', 'width']]
	];
	
	for(var i=0; i< toChangeID.length; i++)
	{
		var obj = document.getElementById(toChangeID[i][0]);
		if(obj)
		{
			for(j=0; j< toChangeID[i][2].length; j++)
			{
				if(toChangeID[i][2][j] == 'height')
				{
					obj.style.height = setWinH + "px";
				}
				else if(toChangeID[i][2][j] == 'width')
				{
					obj.style.width = setWinW + "px";
				}
			}
		}
	}
}

function scrollPage()
{
	if(scrollOn)
	{
		setPageScrollable();
		if(scrollPageTo == 'height')
		{
			window.scrollTo(0,(sWinH-winH));	
		}
	}
}

//functions amends all page content if page is siz eis smaller than limit
function setWindow(){
	//gets the window height and width
	windowSet = true;
	if (parseInt(navigator.appVersion)>3) {
	 if (navigator.appName=="Netscape") {
	  winW = window.innerWidth;
	  winH = window.innerHeight;
	 }
	 if (navigator.appName.indexOf("Microsoft")!=-1) {
	  winW = document.body.offsetWidth;
	  winH = document.body.offsetHeight;
	 }
	}
	
	winH = getMaxHeight();
	return false;
}

//set the window dimensions of the page
function getPageSize() {
	  if( typeof( window.innerWidth ) == 'number' ) {
		//Non-IE
		winW = window.innerWidth;
		winH = window.innerHeight;
	  } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
		//IE 6+ in 'standards compliant mode'
		winW = document.documentElement.clientWidth;
		winH = document.documentElement.clientHeight;
	  } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
		//IE 4 compatible
		winW = document.body.clientWidth;
		winH = document.body.clientHeight;
	  }
	  return true;
}

function setRatio()
{
	if(isRatio)	
	{
		if(rWinW > rWinH)
		{
			var currentRatio = winW/winH;
			if(currentRatio > (rWinW/rWinH))
			{
				winH = winW/(rWinW/rWinH);
			}
			//alert(winH);
			//alert(winW);
		}
		else
		{
			winW = rWinW*winH;
		}
	}
}

//set the srollable dimensions of the page
function setPageScrollable(){
	if (window.innerHeight && window.scrollMaxY) {// Firefox
		sWinH  = window.innerHeight + window.scrollMaxY;
		sWinW 	= window.innerWidth + window.scrollMaxX;
	} else if (document.body.scrollHeight > document.body.offsetHeight){ // all but Explorer Mac
		sWinH  = document.body.scrollHeight;
		sWinW = document.body.scrollWidth;
	} else { // works in Explorer 6 Strict, Mozilla (not FF) and Safari
		//yWithScroll = document.body.offsetHeight;
		//xWithScroll = document.body.offsetWidth;
		sWinH  = document.body.offsetHeight + document.body.offsetTop;
		sWinW = document.body.offsetWidth + document.body.offsetLeft; 
  	}
}

function addLoadListener(fn){
	if (typeof window.addEventListener != 'undefined'){
		window.addEventListener('load', fn, false);
	}else if (typeof document.addEventListener != 'undefined'){
		document.addEventListener('load', fn, false);
	}else if (typeof window.attachEvent != 'undefined'){
		window.attachEvent('onload', fn);
	}else{
		var oldfn = window.onload;
		if (typeof window.onload != 'function'){
		window.onload = fn;
		}else{
			window.onload = function(){
				oldfn();
				fn();
			};
		}
	}
}
