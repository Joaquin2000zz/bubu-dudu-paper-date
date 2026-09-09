const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
html=html.replace(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g,(_,src)=>'<style>'+fs.readFileSync(path.join(root,'dist',src),'utf8')+'</style>');
html=html.replace(/<script\b[^>]*src="([^"]+\.js)"[^>]*><\/script>/g,(_,src)=>'<script type="module">'+fs.readFileSync(path.join(root,'dist',src),'utf8').replaceAll('</script','<\\/script')+'</script>');
fs.writeFileSync(path.join(root,'dist','bubu-dudu.html'),html);
fs.copyFileSync(path.join(root,'bubu_dudu_paper_date_final.html'),path.join(root,'dist','bubu_dudu_paper_date_final.html'));
console.log('Built dist/bubu-dudu.html — standalone, no network dependencies.');
