'use strict';

const films={main:{file:'main-video',poster:'main-video',key:'main_video',title:'Overview and selected results'},ours:{file:'ours-results',poster:'ours-results',key:'ours_results',title:'Ours · Extended results'},comparison:{file:'baseline-comparisons',poster:'baseline-comparisons',key:'baseline_comparisons',title:'Baseline comparisons'}};

const video=document.getElementById('film');let currentFilm='main';let chapterRows=[];let pendingSeek=null;

const timeLabel=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

function renderChapters(){const chapters=window.VIDEO_CHAPTERS[films[currentFilm].key];const container=document.getElementById('chapters');container.replaceChildren();chapterRows=chapters.map(chapter=>{const button=document.createElement('button');button.className='chapter';const time=document.createElement('time');time.textContent=timeLabel(chapter.start_seconds);const label=document.createElement('span');label.textContent=chapter.title;button.append(time,label);button.onclick=()=>{video.currentTime=chapter.start_seconds;video.play().catch(()=>{});};container.append(button);return {button,start:chapter.start_seconds};});document.getElementById('scene-count').textContent=`${chapters.length} scenes`;}

function selectFilm(id,seek=0){if(!films[id])id='main';currentFilm=id;const film=films[id];const revision='?v=selected-v23';video.pause();video.poster=`posters/${film.poster}.jpg${revision}`;video.src=window.supplementAssetUrl(`media/${film.file}.mp4`);pendingSeek=seek;video.load();document.getElementById('film-title').textContent=film.title;const link=document.getElementById('download-video');link.href=window.supplementAssetUrl(`media/${film.file}.mp4`);link.removeAttribute('target');link.removeAttribute('rel');link.removeAttribute('download');document.getElementById('media-error').hidden=true;document.querySelectorAll('[data-film]').forEach(button=>{const selected=button.dataset.film===id;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});renderChapters();window.supplementReplaceHash(`#${id}`);}

document.querySelectorAll('[data-film]').forEach(button=>button.onclick=()=>selectFilm(button.dataset.film));

video.addEventListener('timeupdate',()=>{chapterRows.forEach((row,i)=>row.button.classList.toggle('active',video.currentTime>=row.start&&(i===chapterRows.length-1||video.currentTime<chapterRows[i+1].start)));});

video.addEventListener('loadedmetadata',()=>{if(pendingSeek!==null){video.currentTime=Math.min(pendingSeek,video.duration);pendingSeek=null;}});

video.addEventListener('error',()=>document.getElementById('media-error').hidden=false);

selectFilm(location.hash.slice(1)||'main');

