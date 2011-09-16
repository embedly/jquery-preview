function log(){
  if ($.preview !== undefined && $.preview.debug && console){
    console.log(Array.prototype.slice.call(arguments));
  }
}