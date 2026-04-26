<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>patience</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#0a0a0b;--bg2:#0f0f11;--bg3:#141416;--bg4:#1a1a1e;
  --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);
  --text:#f0eef8;--muted:#6b6880;--muted2:#9b97aa;
  --accent:#8b5cf6;--accent2:#6d28d9;
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;font-size:15px;line-height:1.6;overflow-x:hidden}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
body::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");opacity:0.025}
.bg_orb{position:fixed;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0}
.bg_orb_1{width:700px;height:700px;background:radial-gradient(circle,rgba(109,40,217,0.18) 0%,transparent 70%);top:-200px;left:-100px}
.bg_orb_2{width:500px;height:500px;background:radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%);bottom:-100px;right:-50px}

nav{position:fixed;top:0;left:0;right:0;z-index:100;height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;background:rgba(10,10,11,0.7);backdrop-filter:blur(20px);border-bottom:1px solid var(--border)}
.nav_logo{font-size:16px;font-weight:600;color:var(--text);letter-spacing:-0.02em;text-decoration:none;display:flex;align-items:center;gap:8px}
.nav_logo_dot{width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 12px rgba(139,92,246,0.8)}
.nav_links{display:flex;align-items:center;gap:6px}
.nav_link{padding:7px 14px;border-radius:8px;font-size:13px;color:var(--muted2);text-decoration:none;transition:color 0.2s,background 0.2s}
.nav_link:hover{color:var(--text);background:rgba(255,255,255,0.05)}
.nav_btn{padding:7px 16px;border-radius:8px;font-size:13px;font-weight:500;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#c4b5fd;text-decoration:none;transition:all 0.2s}
.nav_btn:hover{background:rgba(139,92,246,0.25);border-color:rgba(139,92,246,0.5);color:#ddd6fe}

#page_landing{position:relative;z-index:1}
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 24px 80px}
.hero_badge{display:inline-flex;align-items:center;gap:8px;padding:5px 14px;border-radius:99px;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.2);font-size:12px;font-weight:500;color:#c4b5fd;margin-bottom:32px;letter-spacing:0.04em}
.hero_badge_dot{width:5px;height:5px;border-radius:50%;background:#a78bfa;box-shadow:0 0 8px #a78bfa}
.hero_title{font-size:clamp(48px,8vw,88px);font-weight:600;letter-spacing:-0.04em;line-height:1.05;margin-bottom:24px;background:linear-gradient(160deg,#ffffff 0%,#c4b5fd 40%,#818cf8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero_sub{font-size:17px;font-weight:300;color:var(--muted2);max-width:480px;line-height:1.7;margin-bottom:48px}
.hero_btns{display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center}
.btn_primary{padding:12px 28px;border-radius:10px;font-size:14px;font-weight:500;background:var(--accent);border:1px solid rgba(139,92,246,0.5);color:#fff;text-decoration:none;transition:all 0.2s;box-shadow:0 0 30px rgba(139,92,246,0.3)}
.btn_primary:hover{background:#7c3aed;box-shadow:0 0 45px rgba(139,92,246,0.45);transform:translateY(-1px)}
.btn_secondary{padding:12px 28px;border-radius:10px;font-size:14px;font-weight:500;background:rgba(255,255,255,0.05);border:1px solid var(--border2);color:var(--muted2);text-decoration:none;transition:all 0.2s}
.btn_secondary:hover{background:rgba(255,255,255,0.08);color:var(--text);border-color:rgba(255,255,255,0.2);transform:translateY(-1px)}
.section_divider{height:1px;background:linear-gradient(90deg,transparent,var(--border2),transparent);margin:0 40px}
.features{padding:100px 40px;max-width:1100px;margin:0 auto}
.section_label{font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:16px}
.section_title{font-size:clamp(28px,4vw,42px);font-weight:600;letter-spacing:-0.03em;line-height:1.15;margin-bottom:16px;color:var(--text)}
.section_sub{font-size:15px;color:var(--muted2);max-width:500px;line-height:1.7;margin-bottom:64px}
.features_grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
.feature_card{padding:28px;border-radius:14px;background:var(--bg2);border:1px solid var(--border);transition:border-color 0.2s,background 0.2s}
.feature_card:hover{border-color:rgba(139,92,246,0.3);background:var(--bg3)}
.feature_icon{width:38px;height:38px;border-radius:10px;margin-bottom:18px;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.2);display:flex;align-items:center;justify-content:center;color:#a78bfa}
.feature_icon svg{width:18px;height:18px}
.feature_title{font-size:14px;font-weight:600;color:var(--text);margin-bottom:8px}
.feature_desc{font-size:13px;color:var(--muted2);line-height:1.65}
.how_it_works{padding:80px 40px;max-width:1100px;margin:0 auto}
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0;margin-top:48px;position:relative}
.steps::before{content:'';position:absolute;top:22px;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,var(--border2),var(--border2),transparent);z-index:0}
.step{position:relative;z-index:1;text-align:center;padding:0 20px}
.step_num{width:44px;height:44px;border-radius:50%;margin:0 auto 20px;background:var(--bg2);border:1px solid rgba(139,92,246,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#c4b5fd;box-shadow:0 0 20px rgba(139,92,246,0.15)}
.step_title{font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px}
.step_desc{font-size:12px;color:var(--muted);line-height:1.6}
.code_preview{padding:80px 40px;max-width:1100px;margin:0 auto}
.code_block{background:var(--bg2);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-top:40px}
.code_header{display:flex;align-items:center;gap:8px;padding:14px 20px;border-bottom:1px solid var(--border);background:rgba(255,255,255,0.02)}
.code_dot{width:10px;height:10px;border-radius:50%}
.code_dot_r{background:#ff5f57}.code_dot_y{background:#febc2e}.code_dot_g{background:#28c840}
.code_filename{font-size:12px;color:var(--muted);font-family:'Geist Mono',monospace;margin-left:8px}
.code_body{padding:24px 28px;font-family:'Geist Mono',monospace;font-size:13px;line-height:1.8;overflow-x:auto}
.c_comment{color:#555577;font-style:italic}.c_keyword{color:#a78bfa}.c_string{color:#7dd3fc}.c_var{color:#f0eef8}.c_fn{color:#6ee7b7}
.cta_section{padding:100px 40px;text-align:center;max-width:700px;margin:0 auto}
footer{border-top:1px solid var(--border);padding:32px 40px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1}
.footer_left{font-size:13px;color:var(--muted)}
.footer_right{display:flex;gap:20px}
.footer_link{font-size:13px;color:var(--muted);text-decoration:none;transition:color 0.2s}
.footer_link:hover{color:var(--muted2)}


#page_dashboard{display:none;height:100vh;position:relative;z-index:1}
.dash_layout{display:flex;height:100vh;overflow:hidden}

.dash_sidebar{width:54px;flex-shrink:0;background:rgba(10,10,11,0.98);border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:4px}
.sidebar_logo{width:32px;height:32px;border-radius:8px;background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.3);display:flex;align-items:center;justify-content:center;margin-bottom:12px}
.sidebar_logo_dot{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px rgba(139,92,246,0.9)}
.sidebar_btn{width:38px;height:38px;border-radius:9px;border:none;background:transparent;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
.sidebar_btn:hover{background:rgba(255,255,255,0.06);color:var(--muted2)}
.sidebar_btn.active{background:rgba(139,92,246,0.15);color:#c4b5fd;border:1px solid rgba(139,92,246,0.25)}
.sidebar_btn svg{width:18px;height:18px}
.sidebar_spacer{flex:1}
.sidebar_logout{width:38px;height:38px;border-radius:9px;border:none;background:transparent;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
.sidebar_logout:hover{background:rgba(248,113,113,0.1);color:#f87171}
.sidebar_logout svg{width:16px;height:16px}

.dash_main{flex:1;display:flex;flex-direction:column;overflow:hidden}


.dash_topbar{height:50px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid var(--border);background:rgba(10,10,11,0.97);backdrop-filter:blur(20px)}
.dash_topbar_left{display:flex;align-items:center;gap:10px;overflow:hidden;min-width:0}
.dash_topbar_right{display:flex;align-items:center;gap:8px;flex-shrink:0}


.dash_user_badge{display:flex;align-items:center;gap:7px;padding:4px 9px;border-radius:6px;background:rgba(255,255,255,0.04);border:1px solid var(--border);cursor:default;flex-shrink:0}
.dash_avatar{width:20px;height:20px;border-radius:50%;object-fit:cover;flex-shrink:0;display:block}
.dash_avatar_fallback{width:20px;height:20px;border-radius:50%;background:rgba(139,92,246,0.3);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#c4b5fd;flex-shrink:0}
.dash_name_wrap{min-width:0}
.dash_name_default{display:block;font-size:12px;font-weight:500;color:var(--text);white-space:nowrap}
.dash_name_hover{display:none;font-size:11px;color:var(--muted);font-family:'Geist Mono',monospace;white-space:nowrap}
.dash_user_badge:hover .dash_name_default{display:none}
.dash_user_badge:hover .dash_name_hover{display:block}

.admin_badge_icon{width:15px;height:15px;border-radius:50%;background:var(--accent);display:none;align-items:center;justify-content:center;flex-shrink:0}
.admin_badge_icon svg{width:8px;height:8px;stroke:white;fill:none;stroke-width:2.5}

.admin_badge_inline{width:14px;height:14px;border-radius:50%;background:var(--accent);display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;margin-left:4px;flex-shrink:0}
.admin_badge_inline svg{width:7px;height:7px;stroke:white;fill:none;stroke-width:2.5}

.pin_badge_inline{width:14px;height:14px;border-radius:50%;background:rgba(139,92,246,0.25);border:1px solid rgba(139,92,246,0.4);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
.pin_badge_inline svg{width:7px;height:7px;stroke:#c4b5fd;fill:none;stroke-width:2.5}

.save_indicator{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--muted);flex-shrink:0}
.save_dot{width:6px;height:6px;border-radius:50%;background:#4ade80;transition:all 0.4s}
.save_dot.dirty{background:#f59e0b;box-shadow:0 0 8px rgba(245,158,11,0.6)}
.save_dot.saved{background:#4ade80;box-shadow:0 0 8px rgba(74,222,128,0.5)}
.topbar_btn{padding:5px 14px;border-radius:7px;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.2s;border:1px solid}
.btn_set{background:rgba(16,185,129,0.15);border-color:rgba(16,185,129,0.3);color:#6ee7b7}
.btn_set:hover{background:rgba(16,185,129,0.25)}
.btn_set:disabled{opacity:0.4;cursor:default}
.btn_selected_cfg{background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.1);color:var(--muted2);font-family:"Geist Mono",monospace;font-size:10px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.btn_selected_cfg:hover{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.2);color:var(--text)}
.btn_publish{background:rgba(234,179,8,0.15);border-color:rgba(234,179,8,0.3);color:#fde047}
.btn_publish:hover{background:rgba(234,179,8,0.25)}


.tabs_bar{height:36px;flex-shrink:0;display:flex;align-items:stretch;background:rgba(10,10,11,0.6);border-bottom:1px solid var(--border);overflow-x:auto;overflow-y:hidden}
.tabs_bar::-webkit-scrollbar{height:0}
.tab_item{display:flex;align-items:center;gap:6px;padding:0 14px;border-right:1px solid var(--border);font-size:12px;color:var(--muted);cursor:pointer;white-space:nowrap;transition:all 0.15s;position:relative;min-width:80px;max-width:160px;user-select:none}
.tab_item:hover{background:rgba(255,255,255,0.04);color:var(--text)}
.tab_item.active{background:var(--bg);color:var(--text)}
.tab_item.active::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--accent)}
.tab_item.selected_config .tab_dot{width:5px;height:5px;border-radius:50%;background:#a78bfa;flex-shrink:0}
.tab_name_text{flex:1;overflow:hidden;text-overflow:ellipsis}
.tab_close{width:16px;height:16px;border-radius:4px;border:none;background:transparent;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;line-height:1;transition:all 0.15s;padding:0}
.tab_close:hover{background:rgba(248,113,113,0.15);color:#f87171}
.tab_add{padding:0 12px;border:none;background:transparent;color:var(--muted);cursor:pointer;font-size:18px;display:flex;align-items:center;transition:all 0.2s;flex-shrink:0}
.tab_add:hover{color:var(--text);background:rgba(255,255,255,0.04)}

#editor_panel{flex:1;display:flex;overflow:hidden}
#editor_container{flex:1;overflow:hidden}


#marketplace_panel{flex:1;overflow-y:auto;padding:28px;display:none}
.mp_search_wrap{margin-bottom:24px;position:relative}
.mp_search{width:100%;padding:11px 16px 11px 40px;border-radius:10px;font-size:13px;background:var(--bg2);border:1px solid var(--border);color:var(--text);outline:none;transition:border-color 0.2s;font-family:'Inter',sans-serif}
.mp_search:focus{border-color:rgba(139,92,246,0.4)}
.mp_search_icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none}
.mp_grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
.mp_card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px 18px;transition:all 0.2s;display:flex;flex-direction:column}
.mp_card:hover{border-color:rgba(139,92,246,0.3);background:var(--bg3);transform:translateY(-1px)}
.mp_card_name{font-size:13px;font-weight:600;color:var(--text);margin-bottom:5px;letter-spacing:-0.01em;display:flex;align-items:center;gap:5px}
.mp_card_name_text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.mp_card_icon{width:11px;height:11px;flex-shrink:0;opacity:0.7}
.mp_card_desc{font-size:12px;color:var(--muted2);line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;margin-bottom:0;flex:1}
.mp_card_footer{display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)}
.mp_card_author{font-size:11px;color:var(--muted2);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px}
.mp_card_date{font-size:11px;color:var(--muted);flex-shrink:0}
.mp_card_actions{margin-top:12px}
.mp_btn{padding:5px 12px;border-radius:7px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid;transition:all 0.2s;width:100%}
.mp_btn_view{background:rgba(139,92,246,0.15);border-color:rgba(139,92,246,0.3);color:#c4b5fd}
.mp_btn_view:hover{background:rgba(139,92,246,0.25)}
.mp_empty{text-align:center;color:var(--muted);padding:60px 20px;font-size:14px}
.mp_loading{text-align:center;color:var(--muted);padding:60px 20px;font-size:13px}
.mp_pagination{display:none;align-items:center;justify-content:center;gap:14px;margin-top:28px;padding-bottom:24px}
.mp_pg_btn{padding:7px 16px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--border);background:rgba(255,255,255,0.04);color:var(--muted2);transition:all 0.2s}
.mp_pg_btn:hover:not(:disabled){background:rgba(255,255,255,0.08);color:var(--text);border-color:var(--border2)}
.mp_pg_btn:disabled{opacity:0.3;cursor:default}
.mp_pg_info{font-size:12px;color:var(--muted)}


#admin_panel{flex:1;overflow-y:auto;padding:28px;display:none}
.admin_header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px}
.admin_title{font-size:17px;font-weight:600;letter-spacing:-0.02em;display:flex;align-items:center;gap:8px;color:var(--text)}
.admin_title svg{width:16px;height:16px;stroke:var(--accent);fill:none;stroke-width:1.8}
.admin_gen_btn{padding:7px 14px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#c4b5fd;transition:all 0.2s;display:flex;align-items:center;gap:6px}
.admin_gen_btn:hover{background:rgba(139,92,246,0.25)}
.admin_gen_btn:disabled{opacity:0.5;cursor:default}
.admin_gen_btn svg{width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2}
.admin_table{display:flex;flex-direction:column;gap:6px}
.admin_row{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:9px;transition:border-color 0.15s;flex-wrap:nowrap;min-width:0}
.admin_row:hover{border-color:var(--border2)}
.admin_cell_user{display:flex;align-items:center;gap:8px;flex:1;min-width:0;overflow:hidden}
.admin_avatar{width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0}
.admin_avatar_fallback{width:26px;height:26px;border-radius:50%;background:rgba(139,92,246,0.25);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#c4b5fd;flex-shrink:0}
.admin_user_info{min-width:0;overflow:hidden}
.admin_user_name{font-size:12px;font-weight:500;color:var(--text);display:flex;align-items:center;gap:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.admin_user_handle{font-size:10px;color:var(--muted);font-family:'Geist Mono',monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.admin_cell_key{font-family:'Geist Mono',monospace;font-size:10px;color:var(--muted2);display:flex;align-items:center;gap:5px;flex-shrink:0;white-space:nowrap}
.admin_key_copy{padding:2px 6px;border-radius:4px;font-size:10px;cursor:pointer;background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--muted);transition:all 0.15s;font-family:inherit}
.admin_key_copy:hover{background:rgba(255,255,255,0.1);color:var(--text)}
.admin_cell_date{font-size:10px;color:var(--muted);flex-shrink:0;white-space:nowrap}
.admin_cell_id{font-family:'Geist Mono',monospace;font-size:10px;color:var(--muted);flex-shrink:0;white-space:nowrap;display:flex;align-items:center;gap:4px}
.admin_actions{display:flex;gap:5px;flex-shrink:0}
.admin_action_btn{padding:3px 9px;border-radius:5px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid;transition:all 0.15s;white-space:nowrap}
.admin_btn_hwid{background:rgba(59,130,246,0.1);border-color:rgba(59,130,246,0.25);color:#93c5fd}
.admin_btn_hwid:hover{background:rgba(59,130,246,0.2)}
.admin_btn_del{background:rgba(248,113,113,0.08);border-color:rgba(248,113,113,0.25);color:#f87171}
.admin_btn_del:hover{background:rgba(248,113,113,0.18)}
.admin_pagination{display:none;align-items:center;justify-content:center;gap:14px;margin-top:16px;padding-bottom:16px}


.modal_overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:16px}
.modal_overlay.active{display:flex}
.modal{background:var(--bg2);border:1px solid var(--border2);border-radius:16px;padding:32px;width:100%;max-width:400px;animation:modal_in 0.2s ease;position:relative;max-height:90vh;overflow-y:auto}
@keyframes modal_in{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:none}}
.modal_x{position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:7px;border:none;background:transparent;color:var(--muted);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
.modal_x:hover{background:rgba(255,255,255,0.08);color:var(--text)}
.modal_title{font-size:17px;font-weight:600;letter-spacing:-0.02em;margin-bottom:6px}
.modal_sub{font-size:13px;color:var(--muted2);margin-bottom:24px}
.modal_label{font-size:12px;color:var(--muted2);margin-bottom:6px;display:block}
.modal_input{width:100%;padding:11px 14px;border-radius:9px;font-size:13px;background:rgba(255,255,255,0.04);border:1px solid var(--border);color:var(--text);font-family:'Inter',sans-serif;outline:none;transition:border-color 0.2s;margin-bottom:14px}
.modal_input:focus{border-color:rgba(139,92,246,0.5)}
.modal_input.mono{font-family:'Geist Mono',monospace;letter-spacing:0.04em}
.modal_textarea{width:100%;padding:11px 14px;border-radius:9px;font-size:13px;background:rgba(255,255,255,0.04);border:1px solid var(--border);color:var(--text);font-family:'Inter',sans-serif;outline:none;transition:border-color 0.2s;margin-bottom:4px;resize:vertical;min-height:72px;max-height:140px;line-height:1.5}
.modal_textarea:focus{border-color:rgba(139,92,246,0.5)}
.modal_char_count{font-size:11px;color:var(--muted);text-align:right;margin-bottom:14px}
.modal_btn{width:100%;padding:11px;border-radius:9px;font-size:14px;font-weight:500;background:var(--accent);border:none;color:#fff;cursor:pointer;transition:all 0.2s;margin-bottom:8px}
.modal_btn:hover{background:#7c3aed}
.modal_btn:disabled{opacity:0.5;cursor:default}
.modal_btn_danger{width:100%;padding:11px;border-radius:9px;font-size:14px;font-weight:500;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);color:#f87171;cursor:pointer;transition:all 0.2s;margin-bottom:8px}
.modal_btn_danger:hover{background:rgba(248,113,113,0.2)}
.modal_btn_danger:disabled{opacity:0.5;cursor:default}
.modal_btn_ghost{width:100%;padding:9px;border-radius:9px;font-size:13px;background:transparent;border:1px solid var(--border);color:var(--muted);cursor:pointer;transition:all 0.2s}
.modal_btn_ghost:hover{border-color:var(--border2);color:var(--muted2)}
.modal_err{font-size:12px;color:#f87171;min-height:16px;margin-bottom:8px}


.view_author_row{display:flex;align-items:center;gap:9px;margin-bottom:14px;flex-wrap:nowrap}
.view_author_avatar{width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0}
.view_author_avatar_fallback{width:26px;height:26px;border-radius:50%;background:rgba(139,92,246,0.25);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#c4b5fd;flex-shrink:0}
.view_author_info{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0;overflow:hidden}
.view_author_name{font-size:13px;font-weight:500;color:var(--text);display:flex;align-items:center;gap:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.view_author_handle{font-size:11px;color:var(--muted);font-family:'Geist Mono',monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.view_date_badge{font-size:11px;color:var(--muted);white-space:nowrap;flex-shrink:0}
.view_badges{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}
.view_lock_badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:2px 8px;border-radius:5px;background:rgba(245,158,11,0.12);color:#fde047;border:1px solid rgba(245,158,11,0.25)}
.view_lock_badge svg{width:10px;height:10px;stroke:currentColor;fill:none;stroke-width:2.5}
.view_desc{font-size:13px;color:var(--muted2);line-height:1.65;margin-bottom:16px;overflow-wrap:break-word;word-break:break-word;white-space:pre-wrap}
.view_preview{background:var(--bg3);border:1px solid var(--border);border-radius:10px;margin-bottom:16px;font-family:'Geist Mono',monospace;font-size:11px;color:var(--muted2);line-height:1.7;max-height:220px;overflow-y:auto;padding:12px 14px;white-space:pre;overflow-x:auto}
.view_preview_locked{filter:blur(4px);user-select:none;pointer-events:none;white-space:pre;line-height:1.7}
.view_pw_section{margin-bottom:0}

.view_action_row{display:flex;gap:7px;margin-bottom:8px}
.view_action_btn{flex:1;padding:8px 12px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:1px solid;transition:all 0.2s}
.view_action_btn:disabled{opacity:0.5;cursor:default}
.view_action_pin{background:rgba(255,255,255,0.04);border-color:var(--border2);color:var(--muted2)}
.view_action_pin:hover:not(:disabled){background:rgba(255,255,255,0.09);color:var(--text)}
.view_action_pin.pinned{background:rgba(139,92,246,0.12);border-color:rgba(139,92,246,0.3);color:#c4b5fd}
.view_action_del{background:rgba(248,113,113,0.08);border-color:rgba(248,113,113,0.25);color:#f87171}
.view_action_del:hover:not(:disabled){background:rgba(248,113,113,0.18)}

.toast{position:fixed;bottom:28px;right:28px;z-index:999;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:500;transition:opacity 0.3s,transform 0.3s;opacity:0;transform:translateY(8px);pointer-events:none;max-width:360px}
.toast.show{opacity:1;transform:translateY(0)}
.toast.success{background:#052e16;color:#4ade80;border:1px solid rgba(74,222,128,0.25)}
.toast.error{background:#2d0a0a;color:#f87171;border:1px solid rgba(248,113,113,0.25)}
.toast.info{background:#1e1b4b;color:#a78bfa;border:1px solid rgba(167,139,250,0.25)}

@media(max-width:640px){
  nav{padding:0 20px}
  .hero{padding:100px 20px 60px}
  .features,.how_it_works,.code_preview,.cta_section{padding-left:20px;padding-right:20px}
  footer{flex-direction:column;gap:16px;text-align:center}
}
.tab_item.dragging{opacity:0.4;background:rgba(139,92,246,0.1)}
.tab_item.drag_over{border-left:2px solid var(--accent)}
</style>
</head>
<body>
<div class="bg_orb bg_orb_1"></div>
<div class="bg_orb bg_orb_2"></div>


<div id="page_landing">
  <nav>
    <a href="/" class="nav_logo"><div class="nav_logo_dot"></div>patience</a>
    <div class="nav_links">
      <a href="https://discord.gg/getpatience" target="_blank" class="nav_link">discord</a>
      <a href="https://discord.gg/getpatience" target="_blank" class="nav_link">purchase</a>
      <a href="/auth/discord" class="nav_btn">dashboard →</a>
    </div>
  </nav>
  <section class="hero">
    <div class="hero_badge"><div class="hero_badge_dot"></div>next level solution.</div>
    <h1 class="hero_title">patience</h1>
    <p class="hero_sub">enhance your experience and easily manage your configs fully in the cloud with the best da hood lua script.</p>
    <div class="hero_btns">
      <a href="https://discord.gg/getpatience" target="_blank" class="btn_primary">purchase access</a>
      <a href="/auth/discord" class="btn_secondary">dashboard</a>
    </div>
  </section>
  <div class="section_divider"></div>
  <section class="features">
    <div class="section_label">features</div>
    <h2 class="section_title">everything you need</h2>
    <p class="section_sub">a complete closet / rage cheat built for the best experience.</p>
    <div class="features_grid">
      <div class="feature_card">
        <div class="feature_icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg></div>
        <div class="feature_title">closet features</div><div class="feature_desc">every feature you need for closet cheating, all in one script.</div>
      </div>
      <div class="feature_card">
        <div class="feature_icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></div>
        <div class="feature_title">rage features</div><div class="feature_desc">overpowered rage features to dominate when needed.</div>
      </div>
      <div class="feature_card">
        <div class="feature_icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>
        <div class="feature_title">config marketplace</div><div class="feature_desc">discover, share, and import configs from the community marketplace.</div>
      </div>
      <div class="feature_card">
        <div class="feature_icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div>
        <div class="feature_title">undetection</div><div class="feature_desc">regularly updated to stay undetected across every game patch.</div>
      </div>
      <div class="feature_card">
        <div class="feature_icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg></div>
        <div class="feature_title">cloud management</div><div class="feature_desc">manage multiple named configs in the cloud — set any as your active config.</div>
      </div>
      <div class="feature_card">
        <div class="feature_icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
        <div class="feature_title">instant execution</div><div class="feature_desc">your loader always fetches the latest saved config. no re-execution needed.</div>
      </div>
    </div>
  </section>
  <div class="section_divider"></div>
  <section class="how_it_works">
    <div class="section_label">how it works</div>
    <h2 class="section_title">simple by design</h2>
    <div class="steps">
      <div class="step"><div class="step_num">1</div><div class="step_title">purchase a key</div><div class="step_desc">purchase a key from the discord store and claim it with the bot.</div></div>
      <div class="step"><div class="step_num">2</div><div class="step_title">login with discord</div><div class="step_desc">click "dashboard" — your key links automatically via discord.</div></div>
      <div class="step"><div class="step_num">3</div><div class="step_title">set your config</div><div class="step_desc">write your config and hit "set" to make it the active one.</div></div>
      <div class="step"><div class="step_num">4</div><div class="step_title">execute in roblox</div><div class="step_desc">your loader fetches it live every time. done.</div></div>
    </div>
  </section>
  <div class="section_divider"></div>
  <section class="code_preview">
    <div class="section_label">integration</div>
    <h2 class="section_title">loader</h2>
    <p class="section_sub" style="margin-bottom:0">paste this into your executor.</p>
    <div class="code_block">
      <div class="code_header">
        <div class="code_dot code_dot_r"></div><div class="code_dot code_dot_y"></div><div class="code_dot code_dot_g"></div>
        <span class="code_filename">loader.lua</span>
      </div>
      <div class="code_body">
        <div><span class="c_comment">-- .gg/patience</span></div><br>
        <div><span class="c_var">script_key</span> = <span class="c_string">""</span></div>
        <div><span class="c_fn">loadstring</span>(<span class="c_var">game</span>:<span class="c_fn">HttpGet</span>(<span class="c_string">"https://api.luarmor.net/files/v4/loaders/745eba43106a1805de480fe878e35abe.lua"</span>))()</div>
      </div>
    </div>
  </section>
  <div class="section_divider"></div>
  <section class="cta_section">
    <div class="section_label">get started</div>
    <h2 class="section_title">ready to use patience?</h2>
    <p class="section_sub" style="margin:0 auto 40px">purchase your key today.</p>
    <div class="hero_btns">
      <a href="https://discord.gg/getpatience" target="_blank" class="btn_primary">purchase</a>
      <a href="/auth/discord" class="btn_secondary">dashboard</a>
    </div>
  </section>
  <footer>
    <div class="footer_left">© 2025 patience.lol — all rights reserved — tul</div>
    <div class="footer_right">
      <a href="https://discord.gg/getpatience" target="_blank" class="footer_link">discord</a>
      <a href="/auth/discord" class="footer_link">dashboard</a>
    </div>
  </footer>
</div>


<div class="modal_overlay" id="publish_modal">
  <div class="modal">
    <button class="modal_x" onclick="close_publish_modal()">✕</button>
    <div class="modal_title">publish config</div>
    <div class="modal_sub">share your current tab to the marketplace.</div>
    <label class="modal_label">name <span style="color:#f87171">*</span></label>
    <input class="modal_input" id="publish_name" type="text" placeholder="my awesome config" maxlength="40" autocomplete="off"/>
    <label class="modal_label">description <span style="color:var(--muted)">(optional)</span></label>
    <textarea class="modal_textarea" id="publish_desc" placeholder="describe your config…" maxlength="200"></textarea>
    <div class="modal_char_count"><span id="publish_desc_count">0</span>/200</div>
    <label class="modal_label">password <span style="color:var(--muted)">(optional — protects future updates)</span></label>
    <input class="modal_input" id="publish_pw" type="password" placeholder="leave blank for no password" autocomplete="off"/>
    <div class="modal_err" id="publish_err"></div>
    <button class="modal_btn" id="publish_btn">publish</button>
    <button class="modal_btn_ghost" onclick="close_publish_modal()">cancel</button>
  </div>
</div>


<div class="modal_overlay" id="rename_modal">
  <div class="modal" style="max-width:320px">
    <button class="modal_x" onclick="close_rename_modal()">✕</button>
    <div class="modal_title">rename tab</div>
    <input class="modal_input" id="rename_input" type="text" placeholder="new name" maxlength="40" autocomplete="off" style="margin-top:16px"/>
    <div class="modal_err" id="rename_err"></div>
    <button class="modal_btn" id="rename_btn">rename</button>
    <button class="modal_btn_ghost" onclick="close_rename_modal()">cancel</button>
  </div>
</div>


<div class="modal_overlay" id="view_modal">
  <div class="modal" style="max-width:520px">
    <button class="modal_x" onclick="close_view_modal()">✕</button>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px">
      <div class="modal_title" id="view_name" style="margin-bottom:0;padding-right:8px;word-break:break-word"></div>
      <div class="view_badges">
        <span class="view_lock_badge" id="view_lock_badge" style="display:none">
          <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>pw
        </span>
        <span class="pin_badge_inline" id="view_pinned_badge" style="display:none;width:18px;height:18px" title="pinned">
          <svg viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" stroke-width="2.5"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/></svg>
        </span>
      </div>
    </div>
    <div class="view_author_row">
      <div id="view_author_avatar_wrap"></div>
      <div class="view_author_info">
        <div class="view_author_name" id="view_author_name"></div>
        <div class="view_author_handle" id="view_author_handle"></div>
      </div>
      <span class="view_date_badge" id="view_date_badge"></span>
    </div>
    <div class="view_desc" id="view_desc" style="display:none"></div>
    <div class="view_preview" id="view_preview"></div>
    <div class="view_pw_section" id="view_pw_section" style="display:none">
      <label class="modal_label" style="margin-top:4px;display:flex;align-items:center;gap:5px">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        password required to import
      </label>
      <input class="modal_input" id="view_pw_input" type="password" placeholder="enter password" autocomplete="off"/>
    </div>
    <div class="modal_err" id="view_err"></div>
    <button class="modal_btn" id="view_import_btn" onclick="do_view_import()">import to new tab</button>
    <div class="view_action_row" id="view_action_row" style="display:none">
      <button class="view_action_btn view_action_pin" id="view_pin_btn" style="display:none" onclick="do_view_pin()"><span id="view_pin_label">pin</span></button>
      <button class="view_action_btn view_action_del" id="view_delete_btn" onclick="do_view_delete()">delete</button>
    </div>
    <button class="modal_btn_ghost" onclick="close_view_modal()">cancel</button>
  </div>
</div>


<div class="modal_overlay" id="keygen_modal">
  <div class="modal" style="max-width:380px">
    <button class="modal_x" onclick="close_keygen_modal()">✕</button>
    <div class="modal_title">key generated</div>
    <div class="modal_sub">share this with the user. unassigned, no expiry.</div>
    <label class="modal_label">user key</label>
    <input class="modal_input mono" id="keygen_result" type="text" readonly onclick="this.select()" style="cursor:pointer"/>
    <button class="modal_btn" id="keygen_copy_btn" onclick="copy_generated_key()">copy key</button>
    <button class="modal_btn_ghost" onclick="close_keygen_modal()">close</button>
  </div>
</div>


<div id="page_dashboard">
  <div class="dash_layout">
    <div class="dash_sidebar">
      <div class="sidebar_logo"><div class="sidebar_logo_dot"></div></div>
      <button class="sidebar_btn active" id="sb_editor" title="editor" onclick="switch_panel('editor')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      </button>
      <button class="sidebar_btn" id="sb_marketplace" title="marketplace" onclick="switch_panel('marketplace')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4"/><circle cx="9" cy="19" r="1"/><circle cx="20" cy="19" r="1"/></svg>
      </button>
      <button class="sidebar_btn" id="sb_admin" title="admin" onclick="switch_panel('admin')" style="display:none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </button>
      <div class="sidebar_spacer"></div>
      <button class="sidebar_logout" title="log out" onclick="do_logout()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    </div>

    <div class="dash_main">
      <div class="dash_topbar">
        <div class="dash_topbar_left">
          <div class="dash_user_badge" id="dash_user_badge_el">
            <div id="dash_avatar_wrap"></div>
            <div class="dash_name_wrap">
              <span class="dash_name_default" id="dash_display_name"></span>
              <span class="dash_name_hover"   id="dash_username_hover"></span>
            </div>
            <span class="admin_badge_icon" id="dash_admin_badge">
              <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </span>
          </div>
          <div class="save_indicator">
            <div class="save_dot saved" id="save_dot"></div>
            <span id="save_status" style="font-size:11px;color:var(--muted)">saved</span>
          </div>
        </div>
        <div class="dash_topbar_right">
          <button class="topbar_btn btn_selected_cfg" id="selected_cfg_btn" onclick="open_selected_tab()"></button>
          <button class="topbar_btn btn_publish" id="publish_btn_top" onclick="open_publish_modal()">publish</button>
          <button class="topbar_btn btn_set" id="set_btn" onclick="do_set()">set</button>
        </div>
      </div>

      <div class="tabs_bar" id="tabs_bar">
        <button class="tab_add" onclick="add_tab()">+</button>
      </div>

      <div id="editor_panel"><div id="editor_container"></div></div>

      <div id="marketplace_panel">
        <div class="mp_search_wrap">
          <svg class="mp_search_icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input class="mp_search" id="mp_search" type="text" placeholder="search configs, authors…" autocomplete="off"/>
        </div>
        <div class="mp_grid" id="mp_grid"><div class="mp_loading">loading...</div></div>
        <div class="mp_pagination" id="mp_pagination">
          <button class="mp_pg_btn" id="mp_prev" onclick="mp_prev_page()">← prev</button>
          <span class="mp_pg_info" id="mp_page_info"></span>
          <button class="mp_pg_btn" id="mp_next" onclick="mp_next_page()">next →</button>
        </div>
      </div>

      <div id="admin_panel">
        <div class="admin_header">
          <div class="admin_title">
            <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            admin panel
          </div>
          <button class="admin_gen_btn" id="admin_gen_key_btn" onclick="do_generate_key()">
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            generate key
          </button>
        </div>
        <div class="mp_search_wrap" style="margin-bottom:14px">
          <svg class="mp_search_icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input class="mp_search" id="admin_search" type="text" placeholder="search by name, username, discord id…" autocomplete="off"/>
        </div>
        <div class="admin_table" id="admin_users_table"><div class="mp_loading">loading...</div></div>
        <div class="admin_pagination" id="admin_users_pg">
          <button class="mp_pg_btn" id="adm_u_prev" onclick="admin_users_prev()">← prev</button>
          <span class="mp_pg_info" id="adm_u_info"></span>
          <button class="mp_pg_btn" id="adm_u_next" onclick="admin_users_next()">next →</button>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const API_BASE = "";


const SHIELD_SVG = `<svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
const ADMIN_BADGE_HTML = `<span class="admin_badge_inline" title="admin">${SHIELD_SVG}</span>`;


let editor = null, editor_ready = false;
let is_dirty = false;
let tabs = [], active_tab = null, selected_tab = null;
let rename_target = null;
let current_panel = "editor";
let current_user = null;
let view_config = null;
let mp_current_page = 1, mp_total_pages = 1, mp_current_search = "";
let admin_users_page = 1, admin_users_total = 1;


function show_landing()   { document.getElementById("page_landing").style.display="block"; document.getElementById("page_dashboard").style.display="none"; }
function show_dashboard() { document.getElementById("page_landing").style.display="none";  document.getElementById("page_dashboard").style.display="block"; }


let toast_timer;
function show_toast(msg, type="success") {
  clearTimeout(toast_timer);
  const t = document.getElementById("toast");
  t.textContent = msg; t.className = "toast "+type+" show";
  toast_timer = setTimeout(() => t.classList.remove("show"), 3200);
}


function set_dirty(v) {
  is_dirty = v;
  document.getElementById("save_dot").className = "save_dot "+(v?"dirty":"saved");
  document.getElementById("save_status").textContent = v?"unsaved":"saved";
}


function open_publish_modal() {
  if (!active_tab) { show_toast("no tab open","error"); return; }
  document.getElementById("publish_name").value = active_tab;
  document.getElementById("publish_desc").value = "";
  document.getElementById("publish_desc_count").textContent = "0";
  document.getElementById("publish_pw").value = "";
  document.getElementById("publish_err").textContent = "";
  document.getElementById("publish_modal").classList.add("active");
  setTimeout(() => document.getElementById("publish_name").focus(), 100);
}
function close_publish_modal() { document.getElementById("publish_modal").classList.remove("active"); }
function open_rename_modal(name) {
  rename_target = name;
  document.getElementById("rename_input").value = name;
  document.getElementById("rename_err").textContent = "";
  document.getElementById("rename_modal").classList.add("active");
  setTimeout(() => { const i = document.getElementById("rename_input"); i.focus(); i.select(); }, 100);
}
function close_rename_modal() { document.getElementById("rename_modal").classList.remove("active"); rename_target = null; }
function close_keygen_modal() { document.getElementById("keygen_modal").classList.remove("active"); }

function open_view_modal(config) {
  view_config = config;
  document.getElementById("view_name").textContent = config.name;
  document.getElementById("view_lock_badge").style.display   = config.has_password ? "inline-flex" : "none";
  document.getElementById("view_pinned_badge").style.display = config.pinned        ? "inline-flex" : "none";

  const discord_id   = config.author_discord_id;
  const display_name = config.author_username || "unknown";
  const handle       = config.author_handle ? "@"+config.author_handle : "";
  const is_admin_a   = config.is_admin_author;

  const av_wrap = document.getElementById("view_author_avatar_wrap");
  av_wrap.innerHTML = "";
  if (discord_id && config.author_avatar) {
    const img = document.createElement("img");
    img.className = "view_author_avatar";
    img.src = `https://cdn.discordapp.com/avatars/${discord_id}/${config.author_avatar}.webp?size=32`;
    img.onerror = () => img.replaceWith(make_view_av_fallback(display_name));
    av_wrap.appendChild(img);
  } else { av_wrap.appendChild(make_view_av_fallback(display_name)); }

  document.getElementById("view_author_name").innerHTML   = esc(display_name) + (is_admin_a ? ADMIN_BADGE_HTML : "");
  document.getElementById("view_author_handle").textContent = handle;
  document.getElementById("view_date_badge").textContent    = new Date(config.updated_at).toLocaleDateString();

  const desc_el = document.getElementById("view_desc");
  if (config.description?.trim()) { desc_el.textContent = config.description; desc_el.style.display = ""; }
  else desc_el.style.display = "none";

  const prev_el = document.getElementById("view_preview");
  if (config.has_password) {
    const locked = document.createElement("div");
    locked.className = "view_preview_locked";
    locked.textContent = "shared.patience = {\n    ['combat'] = {\n        ['aimbot'] = {\n            ['enabled'] = true,\n            ['smoothness'] = 0.13,\n            ['hit_bone'] = \"head\",\n        },\n        ['silent_aim'] = {\n            ['enabled'] = true,\n            ['hit_chance'] = 100,\n        },\n    },\n    ['visuals'] = {\n        ['name'] = { ['enabled'] = true },\n    },\n}";
    prev_el.innerHTML = ""; prev_el.appendChild(locked);
  } else { prev_el.textContent = "loading…"; fetch_view_preview(config.id); }

  document.getElementById("view_pw_section").style.display = config.has_password ? "" : "none";
  document.getElementById("view_pw_input").value = "";
  document.getElementById("view_err").textContent = "";

  const import_btn = document.getElementById("view_import_btn");
  import_btn.textContent = config.has_password ? "unlock & import" : "import to new tab";
  import_btn.disabled = false;

  const can_del = current_user && (config.author_discord_id === current_user.discord_id || current_user.is_admin);
  const can_pin = current_user?.is_admin;
  const action_row = document.getElementById("view_action_row");
  const pin_btn    = document.getElementById("view_pin_btn");
  const del_btn    = document.getElementById("view_delete_btn");

  if (can_del || can_pin) {
    action_row.style.display = "flex";
    if (can_pin) {
      pin_btn.style.display = "";
      document.getElementById("view_pin_label").textContent = config.pinned ? "unpin" : "pin";
      pin_btn.className = "view_action_btn view_action_pin" + (config.pinned ? " pinned" : "");
      pin_btn.disabled = false;
    } else {
      pin_btn.style.display = "none";
    }
    del_btn.style.display = can_del ? "" : "none";
    del_btn.disabled = false;
  } else {
    action_row.style.display = "none";
  }

  document.getElementById("view_modal").classList.add("active");
}

function make_view_av_fallback(name) {
  const el = document.createElement("div"); el.className = "view_author_avatar_fallback";
  el.textContent = (name||"?").charAt(0).toUpperCase(); return el;
}

async function fetch_view_preview(id) {
  try {
    const data = await api_post("/marketplace/get", { id });
    if (data.success) document.getElementById("view_preview").textContent = data.code;
  } catch {}
}

function close_view_modal() { document.getElementById("view_modal").classList.remove("active"); view_config = null; }

async function do_view_import() {
  if (!view_config) return;
  const pw = view_config.has_password ? document.getElementById("view_pw_input").value : "";
  const btn = document.getElementById("view_import_btn");
  btn.disabled = true; btn.textContent = "importing…";
  document.getElementById("view_err").textContent = "";
  const data = await api_post("/marketplace/get", { id: view_config.id, password: pw });
  if (!data.success) {
    document.getElementById("view_err").textContent = data.password_required ? "incorrect password." : (data.message||"failed.");
    btn.disabled = false; btn.textContent = view_config.has_password ? "unlock & import" : "import to new tab"; return;
  }
  let tab_name = view_config.name, n = 1;
  while (tabs.find(t => t.name===tab_name)) tab_name = view_config.name+" ("+(n++)+")";
  tabs.push({ name: tab_name, code: data.code });
  await api_post("/tabs/save", { name: tab_name, code: data.code });
  close_view_modal(); switch_panel("editor"); render_tabs(tab_name);
  if (editor_ready) { editor.setValue(data.code); set_dirty(false); }
  active_tab = tab_name; show_toast("imported: "+tab_name,"success");
  btn.disabled = false; btn.textContent = view_config?.has_password ? "unlock & import" : "import to new tab";
}

async function do_view_delete() {
  if (!view_config) return;
  if (!confirm(`delete "${view_config.name}" from the marketplace?`)) return;
  const btn = document.getElementById("view_delete_btn"); btn.disabled = true;
  try {
    const res = await fetch(`/marketplace/${view_config.id}`, { method:"DELETE" });
    const data = await res.json();
    if (data.success) { close_view_modal(); show_toast("config deleted","success"); load_marketplace(mp_current_search); }
    else { show_toast(data.message||"failed","error"); btn.disabled=false; }
  } catch { show_toast("could not reach server","error"); btn.disabled=false; }
}

async function do_view_pin() {
  if (!view_config) return;
  const btn = document.getElementById("view_pin_btn"); btn.disabled = true;
  try {
    const res  = await fetch(`/admin/marketplace/${view_config.id}/pin`, { method:"POST" });
    const data = await res.json();
    if (data.success) {
      view_config.pinned = data.pinned;
      document.getElementById("view_pin_label").textContent = data.pinned ? "unpin" : "pin";
      btn.className = "view_action_btn view_action_pin" + (data.pinned ? " pinned" : "");
      document.getElementById("view_pinned_badge").style.display = data.pinned ? "inline-flex" : "none";
      show_toast(data.pinned ? "pinned" : "unpinned","success");
      load_marketplace(mp_current_search);
    } else show_toast(data.message||"failed","error");
  } catch { show_toast("could not reach server","error"); }
  btn.disabled = false;
}

["publish_modal","rename_modal","view_modal","keygen_modal"].forEach(id => {
  document.getElementById(id).addEventListener("click", function(e){ if(e.target===this) this.classList.remove("active"); });
});


async function api_post(path, body) {
  const res = await fetch(API_BASE+path, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  return res.json();
}
async function api_get(path) { return (await fetch(API_BASE+path)).json(); }


async function check_auth() {
  const params = new URLSearchParams(window.location.search);
  const err    = params.get("auth_error");
  if (err) {
    const msgs = { no_key:"Your Discord is not linked to a key. Use the bot in the server to claim your key first.", banned:"Your account has been banned.", expired:"Your key has expired.", server_error:"Something went wrong — please try again.", cancelled:"Login was cancelled." };
    setTimeout(() => show_toast(msgs[err]||"Login failed.","error"), 400);
    history.replaceState({}, "", "/");
  }
  try { const data = await api_get("/auth/me"); if (data.success) { current_user = data; await enter_dashboard(); } } catch {}
}

async function enter_dashboard() {
  const { discord_id, username, global_name, avatar, is_admin } = current_user;
  const display = global_name || username;
  document.getElementById("dash_display_name").textContent = display;
  document.getElementById("dash_username_hover").textContent = "@"+username;
  if (is_admin) { document.getElementById("dash_admin_badge").style.display = "inline-flex"; document.getElementById("sb_admin").style.display = ""; }

  const wrap = document.getElementById("dash_avatar_wrap");
  if (avatar) {
    const img = document.createElement("img"); img.className="dash_avatar";
    img.src = `https://cdn.discordapp.com/avatars/${discord_id}/${avatar}.webp?size=32`;
    img.onerror = () => img.replaceWith(make_av_fallback(display));
    wrap.appendChild(img);
  } else wrap.appendChild(make_av_fallback(display));

  show_dashboard();
  const data = await api_post("/tabs/load", {});
  if (!data.success) { show_toast("failed to load tabs","error"); return; }
  tabs = data.tabs||[]; selected_tab = data.selected_tab||null;

  if (!tabs.length) {
    let dc = "";
    try { dc = await (await fetch("/default_config.lua")).text(); } catch { dc = "shared.patience = {}\n"; }
    tabs = [{ name:"config 1", code:dc }];
    await api_post("/tabs/save", { name:"config 1", code:dc });
  }
  update_selected_btn(); render_tabs(tabs[0].name);
  if (!editor_ready) init_monaco(tabs[0].code);
  else { editor.setValue(tabs[0].code); set_dirty(false); }
}

function make_av_fallback(n) { const el=document.createElement("div"); el.className="dash_avatar_fallback"; el.textContent=(n||"?").charAt(0).toUpperCase(); return el; }


function render_tabs(activate) {
  const bar = document.getElementById("tabs_bar"); bar.innerHTML="";
  tabs.forEach(t => {
    const el = document.createElement("div");
    el.className = "tab_item"+(t.name===activate?" active":"")+(t.name===selected_tab?" selected_config":"");
    el.dataset.name = t.name; el.draggable = true;
    el.innerHTML = `${t.name===selected_tab?'<div class="tab_dot"></div>':""}<span class="tab_name_text">${esc(t.name)}</span><button class="tab_close">×</button>`;
    el.addEventListener("click", () => switch_tab(t.name));
    el.querySelector(".tab_name_text").addEventListener("dblclick", e => { e.stopPropagation(); open_rename_modal(t.name); });
    el.querySelector(".tab_close").addEventListener("click", e => { e.stopPropagation(); delete_tab(t.name); });
    el.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain",t.name); el.classList.add("dragging"); });
    el.addEventListener("dragend",   () => el.classList.remove("dragging"));
    el.addEventListener("dragover",  e => { e.preventDefault(); el.classList.add("drag_over"); });
    el.addEventListener("dragleave", () => el.classList.remove("drag_over"));
    el.addEventListener("drop", e => {
      e.preventDefault(); el.classList.remove("drag_over");
      const fn = e.dataTransfer.getData("text/plain"); if (fn===t.name) return;
      const fi = tabs.findIndex(x=>x.name===fn), ti = tabs.findIndex(x=>x.name===t.name);
      if (fi===-1||ti===-1) return;
      tabs.splice(ti,0,tabs.splice(fi,1)[0]); render_tabs(active_tab);
    });
    bar.appendChild(el);
  });
  const add = document.createElement("button"); add.className="tab_add"; add.textContent="+"; add.onclick=add_tab;
  bar.appendChild(add);
  if (activate) active_tab = activate;
}
function switch_tab(name) {
  if (name===active_tab) return;
  const cur = tabs.find(t=>t.name===active_tab);
  if (cur&&editor_ready) cur.code=editor.getValue();
  active_tab=name; const t=tabs.find(t=>t.name===name);
  if (t&&editor_ready) { editor.setValue(t.code); set_dirty(false); }
  render_tabs(name);
}
async function add_tab() {
  let n=1; while(tabs.find(t=>t.name==="config "+n)) n++;
  const name="config "+n, code="-- "+name+"\n";
  tabs.push({name,code}); await api_post("/tabs/save",{name,code});
  render_tabs(name); if(editor_ready){editor.setValue(code);set_dirty(false);} active_tab=name;
}
async function delete_tab(name) {
  if(tabs.length<=1){show_toast("cannot delete last tab","error");return;}
  if(!confirm(`delete tab "${name}"?`))return;
  await api_post("/tabs/delete",{name}); tabs=tabs.filter(t=>t.name!==name);
  if(selected_tab===name) selected_tab=null;
  const next=tabs[0].name; render_tabs(next);
  if(editor_ready){editor.setValue(tabs[0].code);set_dirty(false);} active_tab=next; update_selected_btn();
}

async function do_save(silent=false) {
  if(!editor_ready||!active_tab) return;
  const code=editor.getValue(), t=tabs.find(t=>t.name===active_tab);
  if(t) t.code=code;
  try { const data=await api_post("/tabs/save",{name:active_tab,code}); if(data.success)set_dirty(false); else if(!silent)show_toast(data.message||"save failed","error"); }
  catch{ if(!silent)show_toast("could not reach server","error"); }
}
async function do_set() {
  if(!active_tab) return; await do_save();
  const data=await api_post("/tabs/set",{name:active_tab});
  if(data.success){selected_tab=active_tab;render_tabs(active_tab);update_selected_btn();show_toast("set as active config","success");}
  else show_toast(data.message||"failed","error");
}
function update_selected_btn() {
  const btn=document.getElementById("selected_cfg_btn"); if(!btn) return;
  btn.textContent=selected_tab?"● "+selected_tab:"no config set";
  btn.title=selected_tab?"selected: "+selected_tab+" — click to open":"no config set yet";
}
function open_selected_tab() {
  if(!selected_tab){show_toast("no config set yet","error");return;}
  const exists=tabs.find(t=>t.name===selected_tab);
  if(exists){switch_panel("editor");switch_tab(selected_tab);}
  else api_post("/tabs/load",{}).then(data=>{if(data.success){const t=data.tabs.find(t=>t.name===selected_tab);if(t){tabs.push(t);switch_panel("editor");render_tabs(selected_tab);if(editor_ready){editor.setValue(t.code);set_dirty(false);}active_tab=selected_tab;}}});
}

async function do_rename() {
  const nn=document.getElementById("rename_input").value.trim();
  if(!nn){document.getElementById("rename_err").textContent="name required.";return;}
  if(nn===rename_target){close_rename_modal();return;}
  const btn=document.getElementById("rename_btn"); btn.disabled=true; btn.textContent="renaming…";
  const data=await api_post("/tabs/rename",{old_name:rename_target,new_name:nn});
  if(data.success){
    const t=tabs.find(t=>t.name===rename_target); if(t)t.name=nn;
    if(active_tab===rename_target)active_tab=nn;
    if(selected_tab===rename_target){selected_tab=nn;update_selected_btn();}
    close_rename_modal();render_tabs(active_tab);show_toast("renamed","success");
  } else document.getElementById("rename_err").textContent=data.message||"failed.";
  btn.disabled=false; btn.textContent="rename";
}

async function do_publish() {
  const name=document.getElementById("publish_name").value.trim();
  const desc=document.getElementById("publish_desc").value;
  const pw=document.getElementById("publish_pw").value;
  if(!name){document.getElementById("publish_err").textContent="name is required.";return;}
  const code=editor_ready?editor.getValue():"";
  if(!code.trim()){document.getElementById("publish_err").textContent="nothing to publish.";return;}
  const btn=document.getElementById("publish_btn"); btn.disabled=true; btn.textContent="publishing…";
  document.getElementById("publish_err").textContent="";
  const data=await api_post("/marketplace/publish",{name,description:desc,code,password:pw});
  if(data.success){close_publish_modal();show_toast("published to marketplace","success");}
  else document.getElementById("publish_err").textContent=data.message||"failed.";
  btn.disabled=false; btn.textContent="publish";
}


async function load_marketplace(search="") {
  mp_current_search=search;
  const grid=document.getElementById("mp_grid"); grid.innerHTML='<div class="mp_loading">loading...</div>';
  const params=new URLSearchParams({page:mp_current_page}); if(search)params.set("search",search);
  const data=await api_get("/marketplace/list?"+params);
  if(!data.success||!data.configs.length){grid.innerHTML='<div class="mp_empty">no configs found.</div>';update_mp_pg(0,1,1);return;}
  grid.innerHTML="";
  data.configs.forEach(c=>{
    const card=document.createElement("div"); card.className="mp_card";
    const pin_icon = c.pinned ? `<span class="pin_badge_inline" title="pinned"><svg viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" stroke-width="2.5"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/></svg></span>` : "";
    const lock_icon = c.has_password ? `<svg class="mp_card_icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--muted)"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>` : "";
    card.innerHTML=`
      <div class="mp_card_name">${pin_icon}<span class="mp_card_name_text">${esc(c.name)}</span>${lock_icon}</div>
      ${c.description?`<div class="mp_card_desc">${esc(c.description)}</div>`:'<div style="flex:1"></div>'}
      <div class="mp_card_footer">
        <span class="mp_card_author">${c.author_username?esc(c.author_username):"unknown"}</span>
        <span class="mp_card_date">${new Date(c.updated_at).toLocaleDateString()}</span>
      </div>
      <div class="mp_card_actions"><button class="mp_btn mp_btn_view">view</button></div>
    `;
    card.querySelector(".mp_btn_view").onclick=()=>open_view_modal(c);
    grid.appendChild(card);
  });
  update_mp_pg(data.total,data.page,data.pages);
}
function update_mp_pg(total,page,pages) {
  mp_current_page=page; mp_total_pages=pages;
  const pg=document.getElementById("mp_pagination");
  if(total<=20){pg.style.display="none";return;}
  pg.style.display="flex";
  document.getElementById("mp_page_info").textContent=`page ${page} of ${pages}  (${total} configs)`;
  document.getElementById("mp_prev").disabled=page<=1;
  document.getElementById("mp_next").disabled=page>=pages;
}
function mp_prev_page(){if(mp_current_page<=1)return;mp_current_page--;load_marketplace(mp_current_search);}
function mp_next_page(){if(mp_current_page>=mp_total_pages)return;mp_current_page++;load_marketplace(mp_current_search);}


function switch_panel(panel) {
  current_panel=panel;
  ["editor","marketplace","admin"].forEach(p=>{
    const el=document.getElementById(p==="editor"?"editor_panel":p+"_panel");
    if(el)el.style.display=(p===panel)?(p==="editor"?"flex":"block"):"none";
    const sb=document.getElementById("sb_"+p); if(sb)sb.classList.toggle("active",p===panel);
  });
  document.getElementById("tabs_bar").style.display        = panel==="editor"?"flex":"none";
  document.getElementById("publish_btn_top").style.display = panel==="editor"?"":"none";
  document.getElementById("set_btn").style.display         = panel==="editor"?"":"none";
  if(panel==="marketplace"){mp_current_page=1;load_marketplace(document.getElementById("mp_search").value);}
  if(panel==="admin"){admin_users_page=1;load_admin_users();}
}

function do_logout() {
  if(is_dirty&&!confirm("unsaved changes. log out anyway?"))return;
  window.location.href="/auth/logout";
}

let admin_current_search = "";

async function load_admin_users() {
  const tbl=document.getElementById("admin_users_table"); tbl.innerHTML='<div class="mp_loading">loading...</div>';
  const params=new URLSearchParams({page:admin_users_page}); if(admin_current_search)params.set("search",admin_current_search);
  const data=await api_get(`/admin/users?${params}`);
  if(!data.success||!data.users.length){tbl.innerHTML='<div class="mp_empty">no users found.</div>';update_admin_users_pg(0,1,1);return;}
  tbl.innerHTML="";
  data.users.forEach(u=>{
    const display=u.global_name||u.username;
    const row=document.createElement("div"); row.className="admin_row";
    const key_short=u.user_key.slice(0,8)+"…";
    row.innerHTML=`
      <div class="admin_cell_user">
        <div id="au_av_${u.discord_id}"></div>
        <div class="admin_user_info">
          <div class="admin_user_name">${esc(display)}${u.is_admin?ADMIN_BADGE_HTML:""}</div>
          <div class="admin_user_handle">@${esc(u.username)}</div>
        </div>
      </div>
      <div class="admin_cell_id">
        <span title="${esc(u.discord_id)}">${esc(u.discord_id)}</span>
        <button class="admin_key_copy" onclick="copy_text('${esc(u.discord_id)}',this)">copy</button>
      </div>
      <div class="admin_cell_key">
        <span title="${esc(u.user_key)}">${esc(key_short)}</span>
        <button class="admin_key_copy" onclick="copy_text('${esc(u.user_key)}',this)">copy</button>
      </div>
      <div class="admin_cell_date">${new Date(u.created_at).toLocaleDateString()}</div>
      <div class="admin_actions">
        <button class="admin_action_btn admin_btn_hwid" onclick="admin_reset_hwid('${esc(u.user_key)}',this)">reset hwid</button>
        <button class="admin_action_btn admin_btn_del"  onclick="admin_delete_user('${esc(u.discord_id)}','${esc(display)}',this)">delete</button>
      </div>
    `;
    const av_wrap=row.querySelector(`#au_av_${u.discord_id}`);
    if(u.avatar){const img=document.createElement("img");img.className="admin_avatar";img.src=`https://cdn.discordapp.com/avatars/${u.discord_id}/${u.avatar}.webp?size=32`;img.onerror=()=>img.replaceWith(make_adm_av(display));av_wrap.appendChild(img);}
    else av_wrap.appendChild(make_adm_av(display));
    tbl.appendChild(row);
  });
  update_admin_users_pg(data.total,data.page,data.pages);
}

function update_admin_users_pg(total,page,pages) {
  admin_users_page=page; admin_users_total=pages;
  const pg=document.getElementById("admin_users_pg");
  const prev=document.getElementById("adm_u_prev"), next=document.getElementById("adm_u_next"), info=document.getElementById("adm_u_info");
  if(total<=20){pg.style.display="none";return;}
  pg.style.display="flex"; info.textContent=`page ${page} of ${pages}  (${total})`;
  prev.disabled=page<=1; next.disabled=page>=pages;
}
function admin_users_prev(){if(admin_users_page<=1)return;admin_users_page--;load_admin_users();}
function admin_users_next(){if(admin_users_page>=admin_users_total)return;admin_users_page++;load_admin_users();}

function make_adm_av(n){const el=document.createElement("div");el.className="admin_avatar_fallback";el.textContent=(n||"?").charAt(0).toUpperCase();return el;}

async function do_generate_key() {
  const btn=document.getElementById("admin_gen_key_btn"); btn.disabled=true; btn.querySelector("span")? null : null;
  const orig_html=btn.innerHTML; btn.innerHTML=btn.innerHTML.replace("generate key","generating…");
  const data=await api_post("/admin/generate-key",{});
  btn.disabled=false; btn.innerHTML=orig_html;
  if(data.success){document.getElementById("keygen_result").value=data.user_key;document.getElementById("keygen_modal").classList.add("active");setTimeout(()=>document.getElementById("keygen_result").select(),100);}
  else show_toast(data.message||"failed to generate key","error");
}

function copy_generated_key() {
  const input=document.getElementById("keygen_result"); input.select();
  navigator.clipboard.writeText(input.value).then(()=>{
    const btn=document.getElementById("keygen_copy_btn"); const orig=btn.textContent; btn.textContent="copied!";
    setTimeout(()=>{btn.textContent=orig;},2000);
  }).catch(()=>show_toast("press Ctrl+C to copy","info"));
}

function copy_text(text,btn) {
  navigator.clipboard.writeText(text).then(()=>{const o=btn.textContent;btn.textContent="✓";setTimeout(()=>{btn.textContent=o;},1500);}).catch(()=>show_toast("press Ctrl+C to copy","info"));
}

async function admin_reset_hwid(user_key,btn) {
  if(!confirm("reset HWID for this user?"))return;
  btn.disabled=true; btn.textContent="resetting…";
  const data=await api_post("/admin/users/resethwid",{user_key});
  if(data.success)show_toast("HWID reset","success"); else show_toast(data.message||"failed","error");
  btn.disabled=false; btn.textContent="reset hwid";
}

async function admin_delete_user(discord_id,name,btn) {
  if(!confirm(`Delete "${name}"?\n\nThis removes them from Luarmor, deletes all their tabs, and removes all their marketplace posts.`))return;
  btn.disabled=true; btn.textContent="deleting…";
  try {
    const res=await fetch(`/admin/users/${encodeURIComponent(discord_id)}`,{method:"DELETE"});
    const data=await res.json();
    if(data.success){show_toast("user deleted","success");load_admin_users();}
    else{show_toast(data.message||"failed","error");btn.disabled=false;btn.textContent="delete";}
  } catch{show_toast("could not reach server","error");btn.disabled=false;btn.textContent="delete";}
}



function init_monaco(initial_code) {
  require.config({paths:{vs:"https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs"}});
  require(["vs/editor/editor.main"],function(){
    monaco.editor.defineTheme("patienceDark",{
      base:"vs-dark",inherit:true,
      rules:[{token:"comment",foreground:"3d3a52",fontStyle:"italic"},{token:"keyword",foreground:"a78bfa"},{token:"string",foreground:"7dd3fc"},{token:"number",foreground:"f9a8d4"},{token:"type",foreground:"6ee7b7"}],
      colors:{"editor.background":"#0a0a0b","editor.foreground":"#d4d0e8","editor.lineHighlightBackground":"#ffffff06","editorLineNumber.foreground":"#2a2733","editorLineNumber.activeForeground":"#6d5aac","editor.selectionBackground":"#6d28d930","editorCursor.foreground":"#8b5cf6","scrollbarSlider.background":"#ffffff06","scrollbarSlider.hoverBackground":"#ffffff0e","minimap.background":"#0a0a0b","editorWidget.background":"#0f0f12","editorWidget.border":"#1e1a2e","input.background":"#0f0f12","input.foreground":"#d4d0e8","focusBorder":"#6d28d970"}
    });
    editor=monaco.editor.create(document.getElementById("editor_container"),{
      value:initial_code,language:"lua",theme:"patienceDark",
      fontSize:13,fontFamily:"'Geist Mono','JetBrains Mono','Fira Code','Consolas',monospace",
      fontLigatures:true,minimap:{enabled:true,scale:1,renderCharacters:false},
      scrollBeyondLastLine:false,padding:{top:20,bottom:20},lineNumbers:"on",
      renderLineHighlight:"line",cursorBlinking:"smooth",cursorSmoothCaretAnimation:"on",
      smoothScrolling:true,automaticLayout:true,wordWrap:"off",tabSize:2,
      bracketPairColorization:{enabled:true},
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.KeyS,do_save);
    editor.onDidChangeModelContent(()=>{
      set_dirty(true); clearTimeout(window._autosave);
      window._autosave=setTimeout(()=>{if(is_dirty)do_save(true);},1500);
    });
    editor_ready=true; set_dirty(false);
  });
}

function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}


document.getElementById("publish_btn").addEventListener("click",do_publish);
document.getElementById("rename_btn").addEventListener("click",do_rename);
document.getElementById("rename_input").addEventListener("keydown",e=>{if(e.key==="Enter")do_rename();});
document.getElementById("mp_search").addEventListener("input",e=>{clearTimeout(window._mp_timer);mp_current_page=1;window._mp_timer=setTimeout(()=>load_marketplace(e.target.value),300);});
document.getElementById("admin_search").addEventListener("input",e=>{clearTimeout(window._adm_timer);admin_users_page=1;admin_current_search=e.target.value.trim();window._adm_timer=setTimeout(()=>load_admin_users(),300);});
document.getElementById("view_pw_input").addEventListener("keydown",e=>{if(e.key==="Enter")do_view_import();});
document.getElementById("publish_desc").addEventListener("input",function(){document.getElementById("publish_desc_count").textContent=this.value.length;});
window.addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==="s"&&editor_ready){e.preventDefault();do_save();}
  if(e.key==="Escape"){close_publish_modal();close_rename_modal();close_view_modal();close_keygen_modal();}
});

check_auth();
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js"></script>
</body>
</html>
