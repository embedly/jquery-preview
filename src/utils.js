function log(){
  if ($.preview !== undefined && $.preview.debug && window.console){
    console.log(Array.prototype.slice.call(arguments));
  }
}