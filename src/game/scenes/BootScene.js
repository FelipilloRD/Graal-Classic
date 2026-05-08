import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem.js';
import { createAllTextures } from '../sprites/SpriteFactory.js';

const C = {
  skin: '#FFDCB0', hair: '#6B3A2A', eye: '#1A1A2E', mouth: '#D4836A',
  shirt: '#2E8B57', shirtHi: '#3DA66A', shirtSh: '#1F6B42',
  pants: '#5B3A29', shoe: '#3D2B1F', outline: '#1A1A2E',
  npcShirt: ['#C0392B','#2980B9','#8E44AD','#D4AC0D'],
  npcHair: ['#2C3E50','#E67E22','#ECF0F1','#C0392B'],
  grass1:'#5DB55D', grass2:'#4CA64C', grass3:'#6DC66D',
  dirt:'#A0784B', dirtDk:'#876539',
  water1:'#3498DB', water3:'#5DADE2', waterHi:'#AED6F1',
  sand:'#E8D5A3', sandDk:'#D4C18F',
  stone:'#7F8C8D', stoneDk:'#5D6D6E', stoneLt:'#95A5A6',
  wall:'#B0A090', wallDk:'#8B7B6B',
  wood:'#8B6914', woodDk:'#6B4E0A',
  treeTrunk:'#6B4226', treeTop:'#2D6A2D', treeTopHi:'#3D8A3D', treeShadow:'#1A4A1A',
  crystal1:'#E040FB', crystal2:'#7C4DFF', crystal3:'#00E5FF',
  torch:'#FF9800', torchHi:'#FFC107',
  flower:['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF78C4'],
  roofR:'#C0392B', roofB:'#2471A3', roofG:'#1E8449',
};

function rect(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}

export class BootScene extends Phaser.Scene {
  constructor(){super('BootScene');}

  preload(){
    const w=this.cameras.main.width,h=this.cameras.main.height;
    this.add.text(w/2,h/2-40,'Cargando...',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:'#5DB55D'}).setOrigin(0.5);
  }

  create(){
    this.genTiles();
    this.genPlayer();
    this.genNPCs();
    // Overwrite basic item textures with improved pixel-art versions
    createAllTextures(this);
    this.genObjects();
    const save=SaveSystem.load();
    // Go to StartMenuScene first, passing save data
    this.scene.start('StartMenuScene', { save });
  }

  mk(key,w,h,fn){const c=this.textures.createCanvas(key,w,h);fn(c.context);c.refresh();}

  genTiles(){
    this.mk('grass1',32,32,ctx=>{rect(ctx,0,0,32,32,C.grass1);for(let i=0;i<12;i++){ctx.fillStyle=C.grass2;ctx.fillRect(~~(Math.random()*30),~~(Math.random()*30),2,2);}});
    this.mk('grass2',32,32,ctx=>{rect(ctx,0,0,32,32,C.grass2);for(let i=0;i<8;i++){ctx.fillStyle=C.grass1;ctx.fillRect(~~(Math.random()*30),~~(Math.random()*30),2,2);}});
    this.mk('dirt',32,32,ctx=>{rect(ctx,0,0,32,32,C.dirt);for(let i=0;i<10;i++){ctx.fillStyle=C.dirtDk;ctx.fillRect(~~(Math.random()*30),~~(Math.random()*30),2,2);}});
    this.mk('sand',32,32,ctx=>{rect(ctx,0,0,32,32,C.sand);for(let i=0;i<8;i++){ctx.fillStyle=C.sandDk;ctx.fillRect(~~(Math.random()*30),~~(Math.random()*30),2,2);}});
    this.mk('stone',32,32,ctx=>{rect(ctx,0,0,32,32,C.stone);for(let i=0;i<6;i++){ctx.fillStyle=C.stoneDk;ctx.fillRect(~~(Math.random()*30),~~(Math.random()*30),2,2);}});
    this.mk('wall',32,32,ctx=>{rect(ctx,0,0,32,32,C.wall);rect(ctx,0,0,32,2,C.wallDk);rect(ctx,15,0,2,32,C.wallDk);rect(ctx,0,15,32,2,C.wallDk);});
    for(let f=0;f<4;f++){
      this.mk(`water_${f}`,32,32,ctx=>{rect(ctx,0,0,32,32,C.water1);for(let i=0;i<6;i++){const wx=(i*7+f*4)%30,wy=(i*8+f*3)%30;ctx.fillStyle=C.water3;ctx.fillRect(wx,wy,4,2);}if(f%2===0){ctx.fillStyle=C.waterHi;ctx.fillRect((8+f*6)%30,(4+f*4)%30,2,2);}});
    }
  }

  genPlayer(){
    const fw=32,fh=48,cols=6,rows=4;
    const can=this.textures.createCanvas('player_tex',fw*cols,fh*rows);
    const ctx=can.context;
    ['down','left','right','up'].forEach((dir,r)=>{
      for(let c=0;c<6;c++){
        this.drawChar(ctx,c*fw,r*fh,dir,c<4?c:0,c>=4,C.shirt,C.shirtHi,C.shirtSh,C.hair);
      }
    });
    can.refresh();
    // Add frames manually to the CanvasTexture
    const tex = this.textures.get('player_tex');
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        tex.add(r*cols+c, 0, c*fw, r*fh, fw, fh);
      }
    }
    this.mkAnims('player_tex');
  }

  genNPCs(){
    for(let n=0;n<4;n++){
      const key=`npc_${n}`,fw=32,fh=48,cols=6,rows=4;
      const can=this.textures.createCanvas(key,fw*cols,fh*rows);
      const ctx=can.context;
      const sc=C.npcShirt[n],hc=C.npcHair[n];
      ['down','left','right','up'].forEach((dir,r)=>{
        for(let c=0;c<cols;c++) this.drawChar(ctx,c*fw,r*fh,dir,0,true,sc,sc,sc,hc);
      });
      can.refresh();
      const tex=this.textures.get(key);
      for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
          tex.add(r*cols+c, 0, c*fw, r*fh, fw, fh);
        }
      }
      this.mkAnims(key);
    }
  }


  drawChar(ctx,ox,oy,dir,wf,idle,sc,shi,ssh,hc){
    const ls=idle?0:Math.sin(wf*Math.PI/2)*3;
    const bb=idle?0:Math.abs(Math.sin(wf*Math.PI/2));
    const as=idle?0:Math.sin(wf*Math.PI/2)*2;
    const by=oy+bb;
    ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(ox+16,oy+46,10,3,0,0,Math.PI*2);ctx.fill();
    rect(ctx,ox+9,by+32,6,10+ls,C.pants);rect(ctx,ox+17,by+32,6,10-ls,C.pants);
    rect(ctx,ox+8,by+41+ls,8,4,C.shoe);rect(ctx,ox+16,by+41-ls,8,4,C.shoe);
    rect(ctx,ox+7,by+20,18,14,sc);rect(ctx,ox+8,by+21,4,6,shi||sc);rect(ctx,ox+7,by+31,18,3,ssh||sc);
    if(dir==='left'){rect(ctx,ox+4,by+21+as,5,12,sc);rect(ctx,ox+5,by+31+as,3,3,C.skin);}
    else if(dir==='right'){rect(ctx,ox+23,by+21-as,5,12,sc);rect(ctx,ox+24,by+31-as,3,3,C.skin);}
    else{rect(ctx,ox+3,by+21+as,5,12,sc);rect(ctx,ox+24,by+21-as,5,12,sc);rect(ctx,ox+4,by+31+as,3,3,C.skin);rect(ctx,ox+25,by+31-as,3,3,C.skin);}
    rect(ctx,ox+6,by+2,20,8,hc);
    if(dir==='down'){
      rect(ctx,ox+7,by+6,18,14,C.skin);
      rect(ctx,ox+10,by+11,4,4,'#FFF');rect(ctx,ox+18,by+11,4,4,'#FFF');
      rect(ctx,ox+11,by+12,2,3,C.eye);rect(ctx,ox+19,by+12,2,3,C.eye);
      rect(ctx,ox+14,by+17,4,1,C.mouth);
    }else if(dir==='up'){
      rect(ctx,ox+7,by+8,18,12,C.skin);rect(ctx,ox+6,by+2,20,12,hc);
    }else{
      const fx=dir==='left'?5:9;rect(ctx,ox+fx,by+6,16,14,C.skin);
      const ex=dir==='left'?8:20;
      rect(ctx,ox+ex,by+11,4,4,'#FFF');rect(ctx,ox+ex+1,by+12,2,3,C.eye);
    }
    rect(ctx,ox+5,by+0,22,6,hc);
  }

  mkAnims(key){
    const dm={down:0,left:1,right:2,up:3};
    for(const d of['down','left','right','up']){
      const r=dm[d];
      if(!this.anims.exists(`${key}_walk_${d}`)){
        this.anims.create({key:`${key}_walk_${d}`,frames:this.anims.generateFrameNumbers(key,{start:r*6,end:r*6+3}),frameRate:8,repeat:-1});
      }
      if(!this.anims.exists(`${key}_idle_${d}`)){
        this.anims.create({key:`${key}_idle_${d}`,frames:this.anims.generateFrameNumbers(key,{start:r*6+4,end:r*6+5}),frameRate:2,repeat:-1});
      }
    }
  }

  genItems(){
    const items={
      herb:(ctx)=>{rect(ctx,6,4,4,10,'#2E7D32');rect(ctx,2,2,12,6,'#4CAF50');rect(ctx,4,0,8,4,'#66BB6A');},
      key:(ctx)=>{rect(ctx,4,2,8,4,'#FFD700');rect(ctx,10,2,4,10,'#FFD700');rect(ctx,10,8,6,3,'#FFC107');},
      fish:(ctx)=>{rect(ctx,2,5,10,5,'#42A5F5');rect(ctx,0,7,4,2,'#90CAF9');rect(ctx,11,4,4,3,'#64B5F6');rect(ctx,4,7,2,1,'#1A1A2E');},
      gem:(ctx)=>{rect(ctx,4,2,8,10,'#E040FB');rect(ctx,6,0,4,3,'#F48FB1');rect(ctx,6,3,4,3,'#F8BBD0');},
      mushroom:(ctx)=>{rect(ctx,6,8,4,7,'#FFCC80');rect(ctx,2,2,12,7,'#FF7043');rect(ctx,4,0,8,4,'#FF8A65');},
      apple:(ctx)=>{rect(ctx,4,4,9,9,'#EF5350');rect(ctx,6,2,5,4,'#E53935');rect(ctx,8,0,2,4,'#5D4037');rect(ctx,10,0,2,2,'#4CAF50');},
      coin:(ctx)=>{rect(ctx,4,2,8,12,'#FFC107');rect(ctx,6,0,4,2,'#FFC107');rect(ctx,6,14,4,2,'#FFC107');rect(ctx,6,6,4,4,'#FFD54F');},
      potion:(ctx)=>{rect(ctx,6,0,4,4,'#8D6E63');rect(ctx,4,4,8,10,'#CE93D8');rect(ctx,6,6,4,4,'#E1BEE7');},
      sword:(ctx)=>{rect(ctx,6,0,4,10,'#B0BEC5');rect(ctx,4,10,8,2,'#FFD700');rect(ctx,6,12,4,4,'#8D6E63');},
      scroll:(ctx)=>{rect(ctx,4,2,8,12,'#FFCC80');rect(ctx,2,0,12,2,'#8D6E63');rect(ctx,2,14,12,2,'#8D6E63');rect(ctx,6,4,4,2,'#E65100');},
    };
    for(const[k,fn]of Object.entries(items)){this.mk(`item_${k}`,16,16,fn);}
  }

  genObjects(){
    this.mk('tree',48,64,ctx=>{
      ctx.fillStyle='rgba(0,0,0,0.15)';ctx.beginPath();ctx.ellipse(24,60,18,6,0,0,Math.PI*2);ctx.fill();
      rect(ctx,18,34,12,28,C.treeTrunk);rect(ctx,20,36,4,20,C.wood);
      ctx.fillStyle=C.treeShadow;ctx.beginPath();ctx.arc(24,24,22,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=C.treeTop;ctx.beginPath();ctx.arc(24,22,20,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=C.treeTopHi;ctx.beginPath();ctx.arc(20,18,10,0,Math.PI*2);ctx.fill();
    });
    C.flower.forEach((col,i)=>{
      this.mk(`flower_${i}`,16,16,ctx=>{rect(ctx,7,8,2,8,'#2E7D32');rect(ctx,5,3,6,6,col);rect(ctx,7,5,2,2,'#FFF9C4');});
    });
    this.mk('house',96,80,ctx=>{
      ctx.fillStyle='rgba(0,0,0,0.1)';ctx.fillRect(4,70,92,10);
      rect(ctx,8,30,80,48,'#F5E6D0');rect(ctx,40,50,16,28,C.wood);
      rect(ctx,52,62,2,2,'#FFD700');
      rect(ctx,16,44,14,14,'#87CEEB');rect(ctx,66,44,14,14,'#87CEEB');
      ctx.strokeStyle=C.wood;ctx.lineWidth=2;ctx.strokeRect(16,44,14,14);ctx.strokeRect(66,44,14,14);
    });
    [C.roofR,C.roofB,C.roofG].forEach((col,i)=>{
      this.mk(`roof_${i}`,104,36,ctx=>{
        ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(52,0);ctx.lineTo(104,36);ctx.lineTo(0,36);ctx.closePath();ctx.fill();
      });
    });
    this.mk('fountain',64,64,ctx=>{
      ctx.fillStyle=C.stoneLt;ctx.beginPath();ctx.ellipse(32,48,28,14,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=C.water3;ctx.beginPath();ctx.ellipse(32,46,22,10,0,0,Math.PI*2);ctx.fill();
      rect(ctx,28,20,8,28,C.stone);
      ctx.fillStyle=C.waterHi;ctx.beginPath();ctx.ellipse(32,20,6,3,0,0,Math.PI*2);ctx.fill();
    });
    this.mk('sign',24,32,ctx=>{rect(ctx,10,14,4,18,C.wood);rect(ctx,2,2,20,14,C.wood);rect(ctx,2,2,20,2,C.woodDk);});
    for(let f=0;f<4;f++){
      this.mk(`torch_${f}`,16,32,ctx=>{
        rect(ctx,6,14,4,18,C.wood);
        const fh=8+Math.sin(f*Math.PI/2)*2;
        rect(ctx,4,~~(14-fh),8,~~fh,C.torch);
        rect(ctx,6,~~(14-fh+1),4,~~(fh/2),C.torchHi);
      });
    }
    [C.crystal1,C.crystal2,C.crystal3].forEach((col,i)=>{
      this.mk(`crystal_${i}`,16,24,ctx=>{
        ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(14,16);ctx.lineTo(2,16);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.4)';ctx.fillRect(6,4,3,8);
      });
    });
    this.mk('chat_bubble',24,24,ctx=>{
      ctx.fillStyle='#FFF';ctx.beginPath();ctx.arc(12,9,9,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(9,16);ctx.lineTo(7,23);ctx.lineTo(14,16);ctx.closePath();ctx.fill();
      ctx.fillStyle='#333';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText('...',12,13);
    });
    this.mk('rock',32,24,ctx=>{
      ctx.fillStyle=C.stoneDk;ctx.beginPath();ctx.ellipse(16,16,14,8,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=C.stone;ctx.beginPath();ctx.ellipse(16,14,13,7,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=C.stoneLt;ctx.fillRect(10,10,6,3);
    });
    this.mk('stalactite',16,32,ctx=>{
      ctx.fillStyle=C.stoneDk;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(16,0);ctx.lineTo(10,32);ctx.lineTo(6,32);ctx.closePath();ctx.fill();
      ctx.fillStyle=C.stoneLt;ctx.fillRect(6,0,4,16);
    });
    this.mk('fish_sprite',12,8,ctx=>{
      rect(ctx,2,2,7,4,'#FF9800');rect(ctx,0,3,3,2,'#FFB74D');rect(ctx,8,1,3,2,'#FF9800');rect(ctx,8,5,3,2,'#FF9800');
      rect(ctx,7,3,1,1,'#1A1A2E');
    });
    this.mk('chest_closed',32,32,ctx=>{
      rect(ctx,4,12,24,16,'#6B4E0A'); rect(ctx,4,10,24,4,'#8B6914'); rect(ctx,14,12,4,4,'#FFD700'); rect(ctx,15,14,2,2,'#000');
    });
    this.mk('chest_open',32,32,ctx=>{
      rect(ctx,4,16,24,12,'#6B4E0A'); rect(ctx,4,4,24,10,'#8B6914'); rect(ctx,6,6,20,6,'#4E3400');
    });
    this.mk('bush',32,32,ctx=>{
      ctx.fillStyle=C.treeTop;ctx.beginPath();ctx.arc(16,16,14,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=C.treeTopHi;ctx.beginPath();ctx.arc(12,12,6,0,Math.PI*2);ctx.fill();
    });
    const s_can=this.textures.createCanvas('slime',64,32);
    const s_ctx=s_can.context;
    // Frame 0 (idle)
    s_ctx.fillStyle='#00FF00';s_ctx.beginPath();s_ctx.ellipse(16,20,12,8,0,0,Math.PI*2);s_ctx.fill();
    s_ctx.fillStyle='rgba(255,255,255,0.4)';s_ctx.beginPath();s_ctx.ellipse(12,16,4,2,0,0,Math.PI*2);s_ctx.fill();
    // Frame 1 (squish)
    s_ctx.fillStyle='#00FF00';s_ctx.beginPath();s_ctx.ellipse(48,22,14,6,0,0,Math.PI*2);s_ctx.fill();
    s_ctx.fillStyle='rgba(255,255,255,0.4)';s_ctx.beginPath();s_ctx.ellipse(44,18,5,2,0,0,Math.PI*2);s_ctx.fill();
    s_can.refresh();
    const s_tex=this.textures.get('slime');
    s_tex.add(0,0,0,0,32,32);
    s_tex.add(1,0,32,0,32,32);
    if(!this.anims.exists('slime_move')){
      this.anims.create({key:'slime_move',frames:[{key:'slime',frame:0},{key:'slime',frame:1}],frameRate:4,repeat:-1});
    }
    this.mk('slash',32,32,ctx=>{
      ctx.strokeStyle='#FFFFFF';ctx.lineWidth=4;ctx.lineCap='round';
      ctx.beginPath();ctx.arc(16,16,12,-Math.PI/2,Math.PI/2);ctx.stroke();
    });

    // === EXPANSION: King Slime spritesheet (2 frames, 64x64 each) ===
    const ks_can=this.textures.createCanvas('king_slime',128,64);
    const ks_ctx=ks_can.context;
    // Frame 0 (idle - tall)
    ks_ctx.fillStyle='rgba(0,0,0,0.2)';ks_ctx.beginPath();ks_ctx.ellipse(32,56,28,8,0,0,Math.PI*2);ks_ctx.fill();
    ks_ctx.fillStyle='#1B5E20';ks_ctx.beginPath();ks_ctx.ellipse(32,40,26,22,0,0,Math.PI*2);ks_ctx.fill();
    // Lighter belly
    ks_ctx.fillStyle='#2E7D32';ks_ctx.beginPath();ks_ctx.ellipse(32,44,18,14,0,0,Math.PI*2);ks_ctx.fill();
    // Eyes (red, menacing)
    ks_ctx.fillStyle='#FF0000';ks_ctx.fillRect(22,32,6,6);ks_ctx.fillRect(36,32,6,6);
    ks_ctx.fillStyle='#FFFF00';ks_ctx.fillRect(24,34,2,2);ks_ctx.fillRect(38,34,2,2);
    // Crown
    ks_ctx.fillStyle='#FFD700';ks_ctx.fillRect(18,16,28,6);
    ks_ctx.fillStyle='#FFD700';
    ks_ctx.beginPath();ks_ctx.moveTo(18,16);ks_ctx.lineTo(22,8);ks_ctx.lineTo(26,16);ks_ctx.fill();
    ks_ctx.beginPath();ks_ctx.moveTo(26,16);ks_ctx.lineTo(32,6);ks_ctx.lineTo(38,16);ks_ctx.fill();
    ks_ctx.beginPath();ks_ctx.moveTo(38,16);ks_ctx.lineTo(42,8);ks_ctx.lineTo(46,16);ks_ctx.fill();
    // Gems on crown
    ks_ctx.fillStyle='#E040FB';ks_ctx.fillRect(23,10,2,3);
    ks_ctx.fillStyle='#00E5FF';ks_ctx.fillRect(31,8,2,3);
    ks_ctx.fillStyle='#EF5350';ks_ctx.fillRect(41,10,2,3);
    // Slime shine
    ks_ctx.fillStyle='rgba(255,255,255,0.3)';ks_ctx.beginPath();ks_ctx.ellipse(24,32,8,6,0,0,Math.PI*2);ks_ctx.fill();

    // Frame 1 (squish - wide)
    ks_ctx.fillStyle='rgba(0,0,0,0.2)';ks_ctx.beginPath();ks_ctx.ellipse(96,58,32,6,0,0,Math.PI*2);ks_ctx.fill();
    ks_ctx.fillStyle='#1B5E20';ks_ctx.beginPath();ks_ctx.ellipse(96,46,30,16,0,0,Math.PI*2);ks_ctx.fill();
    ks_ctx.fillStyle='#2E7D32';ks_ctx.beginPath();ks_ctx.ellipse(96,48,22,10,0,0,Math.PI*2);ks_ctx.fill();
    // Eyes
    ks_ctx.fillStyle='#FF0000';ks_ctx.fillRect(84,40,6,6);ks_ctx.fillRect(100,40,6,6);
    ks_ctx.fillStyle='#FFFF00';ks_ctx.fillRect(86,42,2,2);ks_ctx.fillRect(102,42,2,2);
    // Crown
    ks_ctx.fillStyle='#FFD700';ks_ctx.fillRect(82,28,28,6);
    ks_ctx.beginPath();ks_ctx.moveTo(82,28);ks_ctx.lineTo(86,20);ks_ctx.lineTo(90,28);ks_ctx.fill();
    ks_ctx.beginPath();ks_ctx.moveTo(90,28);ks_ctx.lineTo(96,18);ks_ctx.lineTo(102,28);ks_ctx.fill();
    ks_ctx.beginPath();ks_ctx.moveTo(102,28);ks_ctx.lineTo(106,20);ks_ctx.lineTo(110,28);ks_ctx.fill();
    ks_ctx.fillStyle='#E040FB';ks_ctx.fillRect(87,22,2,3);
    ks_ctx.fillStyle='#00E5FF';ks_ctx.fillRect(95,20,2,3);
    ks_ctx.fillStyle='#EF5350';ks_ctx.fillRect(105,22,2,3);
    ks_ctx.fillStyle='rgba(255,255,255,0.3)';ks_ctx.beginPath();ks_ctx.ellipse(88,42,8,4,0,0,Math.PI*2);ks_ctx.fill();
    ks_can.refresh();
    const ks_tex=this.textures.get('king_slime');
    ks_tex.add(0,0,0,0,64,64);
    ks_tex.add(1,0,64,0,64,64);
    if(!this.anims.exists('king_slime_move')){
      this.anims.create({key:'king_slime_move',frames:[{key:'king_slime',frame:0},{key:'king_slime',frame:1}],frameRate:3,repeat:-1});
    }

    // === EXPANSION: Mini Slime spritesheet (2 frames, 24x24 each) ===
    const ms_can=this.textures.createCanvas('mini_slime',48,24);
    const ms_ctx=ms_can.context;
    // Frame 0
    ms_ctx.fillStyle='#388E3C';ms_ctx.beginPath();ms_ctx.ellipse(12,16,10,7,0,0,Math.PI*2);ms_ctx.fill();
    ms_ctx.fillStyle='rgba(255,255,255,0.3)';ms_ctx.beginPath();ms_ctx.ellipse(9,13,3,2,0,0,Math.PI*2);ms_ctx.fill();
    ms_ctx.fillStyle='#1B5E20';ms_ctx.fillRect(8,13,2,2);ms_ctx.fillRect(14,13,2,2);
    // Frame 1
    ms_ctx.fillStyle='#388E3C';ms_ctx.beginPath();ms_ctx.ellipse(36,18,12,5,0,0,Math.PI*2);ms_ctx.fill();
    ms_ctx.fillStyle='rgba(255,255,255,0.3)';ms_ctx.beginPath();ms_ctx.ellipse(33,15,4,2,0,0,Math.PI*2);ms_ctx.fill();
    ms_ctx.fillStyle='#1B5E20';ms_ctx.fillRect(32,15,2,2);ms_ctx.fillRect(38,15,2,2);
    ms_can.refresh();
    const ms_tex=this.textures.get('mini_slime');
    ms_tex.add(0,0,0,0,24,24);
    ms_tex.add(1,0,24,0,24,24);
    if(!this.anims.exists('mini_slime_move')){
      this.anims.create({key:'mini_slime_move',frames:[{key:'mini_slime',frame:0},{key:'mini_slime',frame:1}],frameRate:4,repeat:-1});
    }

    // === EXPANSION: Blue torches (4 frames) ===
    for(let f=0;f<4;f++){
      this.mk(`torch_blue_${f}`,16,32,ctx=>{
        rect(ctx,6,14,4,18,'#5C3A1E');
        const fh=8+Math.sin(f*Math.PI/2)*2;
        rect(ctx,4,~~(14-fh),8,~~fh,'#1E88E5');
        rect(ctx,6,~~(14-fh+1),4,~~(fh/2),'#64B5F6');
      });
    }

    // === EXPANSION: Green torches (4 frames) ===
    for(let f=0;f<4;f++){
      this.mk(`torch_green_${f}`,16,32,ctx=>{
        rect(ctx,6,14,4,18,'#5C3A1E');
        const fh=8+Math.sin(f*Math.PI/2)*2;
        rect(ctx,4,~~(14-fh),8,~~fh,'#4CAF50');
        rect(ctx,6,~~(14-fh+1),4,~~(fh/2),'#81C784');
      });
    }
  }
}
