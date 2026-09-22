function SendDataToFlashMovie()
{
	var flashMovie=getFlashMovieObject();
	//var f = document.forms['frmScorm'];
	//alert(f.elements['txtUltimaPag'].value);
	flashMovie.SetVariable("znThisPage", frmScorm.txtUltimaPag.value);
}

function ReceiveDataFromFlashMovie(varFlash)
{
	var flashMovie=getFlashMovieObject();
	var valor=flashMovie.GetVariable(varFlash);
	return valor;
}


function getFlashMovieObject()
{
   if (navigator.appName.indexOf("Microsoft Internet")!=-1)
   {
     return window.objFlash;
   }
   else
   {
     return window.document.objFlash; 
	}     
}

function pintarFlash(pagina, ancho, alto, version, colorFondo,studentName, modo, usuarioId, puntaje, dataStr) {

	var textoFlash = "";
	var params = "";
	var urlMovie = "";
	
	// Setup de parametros
	params += "?znThisPage="+pagina;
	params += "&nombres="+studentName;
	params += "&usuarioId=" + usuarioId;
	params += "&puntaje=" + puntaje;
	params += "&dataStr=" + dataStr;
	
	// Url de la pelicula
	urlMovie = "Main.swf" + params;

	if (modo=="1") {   // Fullscreen
		ancho = window.innerWidth;		
		alto = window.innerHeight;
		if(typeof ancho == 'undefined' || typeof alto == 'undefined'){
			ancho = document.documentElement.clientWidth;
			alto = document.documentElement.clientHeight;
		}
	}
	
	textoFlash = '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"\n'+
	  '  codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version='+version+',0,0,0"\n'+ 
	  '  width="'+ancho+'" height="'+alto+'" id="objFlash" align="middle">\n'+
	  '  <param name="allowScriptAccess" value="sameDomain" />\n'+
	  '  <param name="movie" value="'+urlMovie+'" />\n'+
	  '  <param name="quality" value="high" />\n';
	  
	if (modo=="1") textoFlash += '<param name="scale" value="exactfit" />';   
	  
	textoFlash += '  <param name="bgcolor" value="'+colorFondo+'" />\n'+
	  '  <embed swliveconnect="true" src="'+urlMovie+'"\n';
	  
	if (modo=="1") textoFlash += 'scale="exactfit"';
	  
	textoFlash += '  quality="high" bgcolor="#ffffff" width="'+ancho+'" height="'+alto+'"\n'+ 
	  '  name="objFlash" align="middle"\n'+ 
	  '  type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer"/>\n'+
	  '  </object>\n';
	//alert(textoFlash);
	document.write(textoFlash);
  
}  

// Esta funcion se hace para Flash, no retorna l codigo de error
// ya que no se puede manejar en Flash y genera error con getURL
function SCOSetValueFlash(nombre,valor) {
	var result = SCOSetValue(nombre,valor)
}	

function salirCurso() {
	parent.salirCurso();
}

function redimensionarCurso() {
		ancho = window.innerWidth;		
		alto = window.innerHeight;
		if(typeof ancho == 'undefined' || typeof alto == 'undefined'){
			ancho = document.documentElement.clientWidth;
			alto = document.documentElement.clientHeight;
		}
		document.getElementsByName("objFlash")[0].width = ancho;
		document.getElementsByName("objFlash")[0].height = alto;
}
