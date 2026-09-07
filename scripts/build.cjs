const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,src)=>'<style>'+fs.readFileSync(path.join(root,src),'utf8')+'</style>');
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,src)=>'<script>'+fs.readFileSync(path.join(root,src),'utf8')+'</script>');
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist','bubu-dudu.html'),html);
console.log('Built dist/bubu-dudu.html — standalone, no network dependencies.');
