
// midi numbers vs note names: http://www.midimountain.com/midi/midi_note_numbers.html
var notes = [48, 50, 52, 53, 55, 57, 59, 60]
//var notes = [60, 62, 64, 65, 67, 69, 71, 72]

var current_col = 0;
var rows = 8
var cols = 8
var maxCols = 8 * 12

var bpm = 120*2 //each sq is 1/2 beat

var loopInterval = null;

function showBody(){
  //takes a bit before ready fires, so do this for now.
  $("#body-loading").hide();
  $("#body-ready").show()
}


function playNote(opts){
  var note = opts.note; // the MIDI note
  var velocity = opts.velocity; // how hard the note hits
  var delay = opts.delay; // the delay
  var len = opts.len // time before release
  if(!velocity) velocity = 127;
  if(!delay) delay = 0;
  if(!len) len = (0.95*60)/(1.0*bpm);
  if(note){
    MIDI.noteOn(0, note, velocity, delay);
    MIDI.noteOff(0, note, delay + len);
  }
}

function handleCol(){
  if(current_col == 0)
    unHilightCol(cols - 1);
  else
    unHilightCol(current_col - 1);

  hilightCol(current_col)
  
  for(var j=0; j<rows; j++){
    tgt = $('#cell_' + j + '_' + current_col)
    if(tgt.hasClass('selected')){
      var opts = {"note":notes[j], "velocity":127}
      // play the note
      playNote(opts);
    }
  }
  current_col += 1;
  if(current_col >= cols) 
    current_col = 0;
}

function hilightCol(col){
  for(var j=0; j<rows; j++){
    tgt = $('#cell_' + j + '_' + col)
    if(tgt.hasClass('selected')){
      tgt.addClass('current');
    }
  }
}

function unHilightCol(col){
  for(var j=0; j<rows; j++){
    tgt = $('#cell_' + j + '_' + col)
    tgt.removeClass('current');
  }
}

//will show/hide cols as needed so that 'n' measures are visible
function showMeasures(n){
  for(var j=0; j<(maxCols/8); j++){
    if(j < n)
      $('.space_' + j).show()
    else
      $('.space_' + j).hide()
  }
  cols = 8*n;
  //console.log("showMeasures: " + n)
  for(var j=0; j<maxCols; j++){
    for(var i=0; i<rows; i++){
      if(j < cols)
        $('#cell_' + i + '_' + j).show()
      else{
        //$('#cell_' + i + '_' + j).removeClass('current')
        $('#cell_' + i + '_' + j).hide()
      }
    }
  }
  $('td.current').removeClass('current')
  hilightCol(current_col)
}

$().ready(function () {
  
  MIDI.loadPlugin({
    soundfontUrl: "./soundfont/",
    instrument: "acoustic_grand_piano",
    callback: function() {
      MIDI.setVolume(0, 127);
      showBody(); //TODO kind hacky?
    }
  });

  for(var i=(rows-1); i>=0; i--){//want 0,0 to be the bottom left.
    $('#buttongrid_1').append('<tr id="row_' + i + '">');
    for(var j=0; j<maxCols; j++){ 
      if(j !== 0 && j%8 === 0) //add space cell every measure
        $('#row_' + i).append('<td class="space space_' + (j/8) + '"> </td>');
      $('#row_' + i).append('<td id="cell_' + i + '_' + j + '" width="20" height="20"> </td>');
      $('#cell_' + i + '_' + j).bind('click', function(event) {
        var tgt = $(event.target);
        if(tgt.hasClass('selected')) tgt.removeClass('selected');
        else tgt.addClass('selected');
        event.preventDefault();
      });
    }
  }
  showMeasures(1);

  $('#controlsForm').bind('submit', function(event) {
    event.preventDefault();
    return false;
  });

  $('#goButton').bind('click', function(event) {
    if(!loopInterval)
      loopInterval = setInterval(function(){handleCol()},1000*60/bpm);
  });

  $('#stopButton').bind('click', function(event) {
    clearInterval(loopInterval)
    loopInterval = null
  });

  $('#volumeSlider').bind('change', function(event) {
    var volume = $('#volumeSlider').val();
    MIDI.setVolume(0, volume);
    $('#currVolume').text( Math.round(100*volume/127) + '%');
  });

  $('#bpmSlider').bind('change', function(event) {
    bpm = 2 * $('#bpmSlider').val();
    if(loopInterval){
      clearInterval(loopInterval);
      loopInterval = setInterval(function(){handleCol()},1000*60/bpm);
    }
    $('#currBPM').text(bpm/2);
  });

  $('#numMeasures').bind('change', function(event) {
    var measures = $('#numMeasures').val();
    showMeasures(measures);
  });
  
});