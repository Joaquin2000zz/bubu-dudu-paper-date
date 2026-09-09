/* Shared identity and authored animation frames. No renderer or DOM dependency. */
  function actorArt(name,view,action='idle',frame=0,emotion='calm'){
    const panda=name==='Bubu',fur=panda?'#fffdf9':'#d9a181',dark='#503329',ear=panda?'#492d27':fur,cheek=panda?'#f4b0ae':'#f5ca80';
    const walk=action==='walk',phase=frame/8*Math.PI*2,step=walk?Math.sin(phase):0,bob=walk?Math.abs(Math.sin(phase))*4:0;
    const giving=action==='give',receive=action==='receive',kissing=action==='kiss',happy=action==='happy'||emotion==='happy';
    const arm=giving?frame/3:receive?1:0,lean=kissing?frame*2.5:0;
    const foot=(x,y,angle)=>`<g transform="rotate(${angle} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="18" ry="12" fill="${panda?'#492d27':fur}"/></g>`;
    let body=`<g stroke="${dark}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${lean} 130 270)">`;
    if(view==='side'){
      body+=foot(96,275-step*7,step*22)+`<path d="M87 192Q68 220 77 257Q81 277 113 274H157Q187 274 187 250Q190 220 174 195" fill="${fur}"/>`+foot(167,275+step*7,-step*22);
      body+=`<g transform="translate(0 ${-bob})"><circle cx="62" cy="68" r="23" fill="${ear}"/><circle cx="196" cy="65" r="21" fill="${ear}"/>`;
      if(!panda)body+=`<circle cx="62" cy="68" r="12" fill="#694331" stroke="none"/><circle cx="196" cy="65" r="10" fill="#694331" stroke="none"/>`;
      body+=`<path d="M133 43C81 40 45 65 39 114C33 148 35 175 55 191Q76 207 134 207Q190 207 211 188Q228 171 225 140C226 97 204 57 169 47Q151 43 133 43Z" fill="${fur}"/>`;
      body+=kissing||happy?`<path d="M113 154q9 -10 17 0M179 151q7 -9 14 0" fill="none" stroke-width="4"/>`:`<circle cx="122" cy="154" r="8" fill="${dark}" stroke="none"/><circle cx="188" cy="151" r="7.5" fill="${dark}" stroke="none"/>`;
      body+=`<ellipse cx="96" cy="177" rx="19" ry="15" fill="${cheek}" stroke="none"/><ellipse cx="209" cy="172" rx="12" ry="13" fill="${cheek}" stroke="none"/>`;
      body+=kissing?'<path d="M163 168q13 -5 16 0q-3 4 -11 4q12 1 10 5q-3 4 -14 -1" fill="none" stroke-width="3.5"/>':'<path d="M148 163q5 8 11 1q6 7 11 -1" fill="none" stroke-width="3.5"/>';
      body+='</g>';
      if(panda)body+='<path d="M132 208L133 220Q138 228 147 218Q158 226 162 217L163 207" fill="#492d27" stroke="none"/>';
      if(giving||receive)body+=`<path d="M144 222Q${166+arm*22} ${225-arm*15} ${179+arm*35} ${221-arm*18}Q${229+arm*4} ${236-arm*19} ${194+arm*14} ${241-arm*11}L148 243" fill="${fur}"/>`;
      else if(kissing)body+=`<path d="M147 223Q180 201 190 215Q194 228 157 241" fill="${fur}"/>`;
      else body+=`<g data-part="arm" transform="rotate(${step*12} 161 220)"><path d="M161 220Q183 222 179 235Q173 244 157 236" fill="${fur}"/></g>`;
    }else{
      body+=foot(91-step*9,275-step*7,step*18)+foot(170+step*9,275+step*7,-step*18);
      body+=`<path d="M83 191Q64 218 72 255Q75 276 108 273H153Q184 275 189 255Q197 218 177 191" fill="${fur}"/>`;
      body+=`<g transform="translate(0 ${-bob})"><circle cx="58" cy="67" r="23" fill="${ear}"/><circle cx="202" cy="67" r="23" fill="${ear}"/>`;
      if(!panda&&view!=='back')body+='<circle cx="58" cy="67" r="12" fill="#694331" stroke="none"/><circle cx="202" cy="67" r="12" fill="#694331" stroke="none"/>';
      body+=`<path d="M130 43C75 40 40 64 35 115C30 150 30 175 52 191C69 205 105 207 130 207C162 207 194 205 212 189C229 175 228 146 224 117C219 67 186 42 130 43Z" fill="${fur}"/>`;
      if(view!=='back'){
        body+=happy?'<path d="M82 154q9 -12 18 0M159 154q9 -12 18 0" fill="none" stroke-width="4"/>':`<circle cx="91" cy="154" r="8" fill="${dark}" stroke="none"/><circle cx="168" cy="154" r="8" fill="${dark}" stroke="none"/>`;
        body+=`<ellipse cx="65" cy="176" rx="18" ry="16" fill="${cheek}" stroke="none"/><ellipse cx="195" cy="176" rx="18" ry="16" fill="${cheek}" stroke="none"/><path d="M119 162Q123 170 130 163Q137 170 141 162" fill="none" stroke-width="3.5"/>`;
      }
      body+='</g>';
      if(panda&&view!=='back')body+='<path d="M114 208L115 220Q119 229 130 217Q141 229 145 220L146 208" fill="#492d27" stroke="none"/>';
      if(view==='back')body+=`<circle cx="130" cy="246" r="12" fill="${panda?'#492d27':fur}"/>`;
      if(view!=='back')body+=`<g data-part="arm" transform="rotate(${step*12} 83 219)"><path d="M83 219Q104 222 101 234Q96 242 80 236" fill="${fur}"/></g><g data-part="arm" transform="rotate(${-step*12} 177 219)"><path d="M177 219Q156 222 159 234Q164 242 180 236" fill="${fur}"/></g>`;
    }
    if(view!=='back'&&(emotion==='crying'||emotion==='sad')){
      const side=view==='side',eyes=side?[122,188]:[91,168],mouth=side?158:130;
      body=body.replace('<path d="M148 163q5 8 11 1q6 7 11 -1" fill="none" stroke-width="3.5"/>',`<path d="M148 170q11 -10 22 0" fill="none" stroke-width="3.5"/>`).replace('<path d="M119 162Q123 170 130 163Q137 170 141 162" fill="none" stroke-width="3.5"/>','<path d="M119 171Q130 160 141 171" fill="none" stroke-width="3.5"/>');
      body+=`<g data-emotion="${emotion}" transform="translate(0 ${-bob})" stroke-width="3" fill="none"><path d="M${eyes[0]-10} 141l15 -5M${eyes[1]-5} 136l15 5" stroke="${dark}"/>`;
      for(const [i,x] of eyes.entries())if(emotion==='crying'||i===0){const y=167+(frame%4)*3;body+=`<path d="M${x} ${y}q-12 17 -7 24q7 9 14 0q5 -7 -7 -24Z" fill="#9fdcec" stroke="#6ca4c2"/><path d="M${x-3} ${y+13}v7" stroke="#e4f8ff"/>`;}
      body+='</g>';
    }
    return body+'</g>';
  }

const PaperCharacters={svg:actorArt,emotion(level,flowers=0){return level===3||flowers>=5?'happy':level===2?'calm':flowers===0?'crying':flowers<3?'sad':'calm'}};

export { PaperCharacters, actorArt };
