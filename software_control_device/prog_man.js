const app_client = require('./app_client');


app_client.on('error', (err) => {
  console.log('whoops! there was an error in prog_man.js == ' + err);
});

//обьявляем переменные
var hits = [];
var targets = new Map();
var idAndForm = new Map();
var nextCadr = false;
var currentCadr = 0;
var instructionsNum = 1;
var activeMishens = new Array("11","22","33","44","1");			//надо заполнить динамически реальными id мишеней
var freeMishens = activeMishens.slice(0);

//программа по умолчанию
var prog123 = [];
prog123.push(new Array());
  
var p00 = new Map();
 p00.set('num', [1,4]);
 p00.set('rdm', false);
 p00.set('stopFactorTime', true);
 p00.set('stopValue', 10000);
 p00.set('nextCadr', false);
 
  var p01 = new Map();
 p00.set('num', [2,3]);
 p00.set('rdm', false);
 p00.set('stopFactorTime', false);
 p00.set('stopValue', 2);
 p00.set('nextCadr', true);
 
 /*//отрабатывает нормально
  var p10 = new Map();
 p00.set('num', 5);
 p00.set('rdm', true);
 p00.set('stopFactorTime', false);
 p00.set('stopValue', 5);
 p00.set('nextCadr', false);
 */
 
/*//проверяем 2 условие rdm false отрабатывает нормально
  var p10 = new Map();
 p00.set('num', [22 , 44, 33]);
 p00.set('rdm', false);
 p00.set('stopFactorTime', false);
 p00.set('stopValue', 2);
 p00.set('nextCadr', false);
 */
 
 //проверяем условие остановки по времени + rdm false
   var p10 = new Map();
 p00.set('num', [11 , 1]);
 p00.set('rdm', false);
 p00.set('stopFactorTime', true);
 p00.set('stopValue', 1000);
 p00.set('nextCadr', false);
 
 
//первый кадр первая форма 
prog123[0][0] = p00

//первый кадр вторая форма
prog123[0][1] = p01
  
//второй кадр первая форма
prog123.push(new Array());
prog123[1][0] = p10

//конец программы

var currentProgram = prog123;							


const EventEmitter = require('events');
module.exports = new EventEmitter();
var count =0;


function start_cadr(program){
	count++;
	
	var indexl =1;       //= currentProgram[currentCadr].length; //временно заменён на 1////////////////////////
	var freeMishens = activeMishens;
	instructionsNum = indexl;
	
	//запускаем каждую форму в кадре в своём потоке
	
	for(var i=0; i < indexl ; i++){
		count++;
		//for (var [key, value] of currentProgram[currentCadr][i]) {
		// console.log(key + " = " + value);}
		//console.log('currentCadr ='+ currentCadr +' ,i = '+i);
		run_program(currentProgram[currentCadr][i]);
		}
}

function killed(id, forma, _){
	var localForma = idAndForm.get(id);
	
	console.log('попадание засчитано по мишени id ='+id);
	hits[id] = hits[id] || localForma.get('stopValue');
	hits[id] = hits[id] - 1;
	console.log('осталось попасть '+hits[id] +' раз');
	if(hits[id] != 0){
		module.exports.emit("start",id);
		app_client.once(id,killed);
	}
	else{
		if (localForma.get('rdm')){	
			var uslovie = localForma.get('num');
		}else {
			var uslovie = localForma.get('num').length;
		}
		if(targets.has(forma.toString()) ){
		var tmp = targets.get(forma.toString());
		}else{
		var tmp = false
		}
		var tmp2 = tmp || uslovie;
		var tmp3 = forma.toString();
		targets.set(tmp3,(tmp2 - 1));
		console.log(id+' убит, осталось '+targets.get(forma.toString())+' целей');
		if (targets.get(forma.toString())==0){
			console.log('все мишени поражены');
		check();
		}
	}
}

function check(){
	instructionsNum = instructionsNum - 1;
	//console.log('instructionsNum = '+instructionsNum);
	if(instructionsNum == 0) {
		console.log('все условия кадра выполнены, проверяем есть ли кадр дальше');
		if(nextCadr) {
			console.log('запускаю следующий кадр');
			currentCadr++;
			clear();
			start_cadr(currentProgram);
		}
		else{
			console.log('кадров больше нет');
			clear();
			module.exports.emit('done');
		}
	}	
}

function clear(){ //обнуляет все данные текущего кадра, подготовка к запуску следующего как будто первого
	
	//перенастраиваем обработку попаданий для всех активных мишеней
		activeMishens.forEach(function(item, i, arr) {
		console.log( i + ": " + item + " (массив:" + arr + ")" );
		app_client.once((item+''),function(id){console.log('отменёная обработка '+id);});//заглушка пока
		console.log('очищен приём сообщений для '+item);
		});
}

function run_program(forma){
	//console.log('условия остановки время = '+ !forma.get('stopFactorTime'));
	
	//если остановка по времени +++
	if(forma.get('stopFactorTime')) {
		console.log('Условия остановки время');
		var timer = setTimeout(check,forma.get('stopValue'));										
		
		//если рандомные
		if(forma.get('rdm')) {
			
		for(var i=0; i < forma.get('num'); i++){
			var randomId = freeMishens[Math.floor(Math.random()*freeMishens.length)];
			module.exports.emit('start',randomId);
			freeMishens.splice(freeMishens.indexOf(randomId),freeMishens.indexOf(randomId)); //спорный момент, возможно надо менять этот случайный айди с последним и удалять последний
			
		}
		}
		//если выборочные +++
		else{
			console.log('Цели выборочные ID = '+forma.get('num'));
			var arrId = forma.get('num');
			var target = arrId.length;
			for( var id in forma.get('num')){
			var stringId = arrId[id]+'';
			console.log('Цель выборочная ID = ',stringId);
			module.exports.emit('start', activeMishens[id]);
			app_client.once(stringId,function(id){console.log('убит '+id);});//заглушка пока
			idAndForm.set(stringId, forma);
			freeMishens.splice(freeMishens.indexOf(stringId),1);
			console.log('freeMishens ='+freeMishens);
			}
		}
	}
	//если остановка по попаданиям +
	else{
		console.log('случайный выбор мишеней = '+forma.get('rdm'));
		var needShot = forma.get('stopValue');
		var hits = [];
		
		//если рандомные +
		if(forma.get('rdm')) {
			var target = forma.get('num');
			console.log('target ='+target);
			for(var i=0; i < forma.get('num'); i++){
				console.log('в перебре генерирующем рандомные id');
			var randomId = freeMishens[Math.floor(Math.random()*freeMishens.length)];
			hits[randomId] = needShot;
			console.log('по мишени с id '+randomId+' нужно попасть '+hits[randomId]);
			app_client.once((randomId+""),killed);
			module.exports.emit("start",randomId);
			idAndForm.set(randomId, forma);
			freeMishens.splice(freeMishens.indexOf(randomId),1); 
			//console.log('freeMishens ='+freeMishens);
			}
		}
		//если выборочные +
		else{
			console.log('выборочные номера мишеней = '+forma.get('num'));	
			
			var asdasd = forma.get('num');
			var target = asdasd.length;
			console.log('target ='+target);
			for (var id in forma.get('num')){
			var hz = asdasd[id]+'';
			hits[hz] = needShot;
			console.log('по мишени с id '+hz+' нужно попасть '+hits[hz]);
			app_client.once(hz,killed); 
			module.exports.emit("start",hz);
			idAndForm.set(hz, forma);
			freeMishens.splice(freeMishens.indexOf(hz),1);
			//console.log('freeMishens ='+freeMishens);
			}
		}
	}
	
}

exports.start = start_cadr(prog123);