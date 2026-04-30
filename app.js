
const API_BASE = "/api";

const SHIELD_SVG = `<svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`;
const ADMIN_BADGE_HTML = `<span class="admin_badge_inline" title="admin">${SHIELD_SVG}`;

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
  const statusEl = document.getElementById("save_status");
  if (statusEl) {
    statusEl.textContent = v ? "unsaved changes" : "saved";
    statusEl.className = "exec_status " + (v ? "unsaved" : "saved");
  }
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
    locked.textContent = "warn(\"wowzaa\"";
    prev_el.innerHTML = ""; prev_el.appendChild(locked);
  } else { prev_el.textContent = "loading&hellip;"; fetch_view_preview(config.id); }

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
  btn.disabled = true; btn.textContent = "importing&hellip;";
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

async function api_post(path, body, method = "POST") {
  const res = await fetch(API_BASE+path, { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  return res.json();
}
async function api_get(path) { return (await fetch(API_BASE+path)).json(); }

async function check_auth() {
  const params = new URLSearchParams(window.location.search);
  const err    = params.get("auth_error");
  if (err) {
    const msgs = { no_key:"Your Discord is not linked to a key. Use the bot in the server to claim your key first.", banned:"Your account has been banned.", expired:"Your key has expired.", server_error:"Something went wrong &mdash; please try again.", cancelled:"Login was cancelled." };
    setTimeout(() => show_toast(msgs[err]||"Login failed.","error"), 400);
    history.replaceState({}, "", "/");
  }
  try { 
    const data = await api_get("/auth/me"); 
    if (data.success) { 
      current_user = data; 
      await enter_dashboard(); 
    }
  } catch(e) {
  }
}

async function enter_dashboard() {
  const { discord_id, username, global_name, avatar, is_admin } = current_user;
  const display = global_name || username;
  document.getElementById("dash_display_name").textContent = display;
  
  // Set avatar
  const avatarImg = document.getElementById("dash_avatar");
  const avatarFallback = document.getElementById("dash_avatar_fallback");
  if (avatar) {
    avatarImg.src = `https://cdn.discordapp.com/avatars/${discord_id}/${avatar}.png`;
    avatarImg.style.display = "block";
    avatarFallback.style.display = "none";
  } else {
    avatarImg.style.display = "none";
    avatarFallback.style.display = "flex";
    avatarFallback.textContent = (display || "?").charAt(0).toUpperCase();
  }
  
  // Show admin tab if user is admin
  if (is_admin) {
    const navAdmin = document.getElementById("nav_admin");
    if (navAdmin) navAdmin.style.display = "";
  }

  show_dashboard();
  
  // Load user tabs from server
  try {
    const data = await api_get("/tabs");
    if (data.success && data.tabs && data.tabs.length > 0) {
      tabs = data.tabs;
      active_tab = tabs[0].name;
      render_tabs(active_tab);
      if (!editor_ready) init_monaco(tabs[0].code);
      else { editor.setValue(tabs[0].code); set_dirty(false); }
    } else {
      // Default config if no tabs exist
      const defaultConfig = `shared.coach = {
    ['Combat'] = {
        ['Silent Aim'] = {
            ['Enabled'] = true,
            ['Bone'] = 'Head',
            ['Bind'] = {
                ['Key'] = 'C',
                ['Type'] = 'Toggle',
                ['Mode'] = 'Target'
            },
            ['Fov'] = {
                ['Enabled'] = true,
                ['Size'] = 11150,
                ['Visuals'] = {
                    ['Enabled'] = true,
                    ['Color'] = Color3.fromRGB(255, 255, 255)
                },
            },
            ['Checks'] = {
                ['Visible'] = true,
                ['Dead'] = true,
                ['Field'] = true
            },
        },

        ['Aim Assist'] = {
            ['Enabled'] = true,
            ['Bone'] = 'Head',
            ['Bind'] = {
                ['Key'] = 'C',
                ['Type'] = 'Toggle',
            },
            ['Fov'] = {
                ['Enabled'] = true,
                ['Size'] = 11150,
                ['Visuals'] = {
                    ['Enabled'] = true,
                    ['Color'] = Color3.fromRGB(255, 255, 255)
                },
            },
            ["Smoothing"] = 0.05,
            ['Checks'] = {
                ['Visible'] = true,
                ['Dead'] = true,
                ['Field'] = true
            },
        },

        ['Triggerbot'] = {
            ['Enabled'] = true,
            ['Delay'] = 0.01,
            ['Bind'] = {
                ['Key'] = 'C',
                ['Type'] = 'Toggle',
            },
            ['Fov'] = {
                ['Enabled'] = true,
                ['Size'] = 11150,
                ['Visuals'] = {
                    ['Enabled'] = true,
                    ['Color'] = Color3.fromRGB(255, 255, 255)
                },
            },
            ['Tools'] = {
                ['Whitelisted'] = {
                    ['Enabled'] = true,
                    ['Items'] = {
                        '[Revolver]',
                        '[Double-Barrel SG]'
                    },
                },
                ['Blacklisted'] = {
                    ['Enabled'] = true,
                    ['Items'] = {
                        '[Knife]',
                    },
                },
            },
            ['Checks'] = {
                ['Visible'] = true,
                ['Dead'] = true,
                ['Field'] = true
            },
        },

        ['Spread Modifier'] = {
            ['Enabled'] = true,
            ['Spread'] = 0,
            ['Whitelisted'] = {
                ['Enabled'] = true,
                ['Items'] = {
                    '[Double-Barrel SG]',
                    '[Revolver]',
                    '[TacticalShotgun]',
                },
            },
        },

        ['Delay Modifier'] = {
            ['Enabled'] = true,
            ['Delay'] = 0,
            ['Whitelisted'] = {
                ['Enabled'] = true,
                ['Items'] = {
                    '[Double-Barrel SG]',
                    '[Revolver]',
                    '[TacticalShotgun]',
                },
            },
        },

        ['Hitbox Expander'] = {
            ['Enabled'] = true,
            ['Size'] = {
                ['X'] = 3,
                ['Y'] = 3,
                ['Z'] = 3
            },
        },

        ['Damage Override'] = {
            ['Enabled'] = true,
            ['Mode'] = 'Full',
        },
    },

    ['Skin Changer'] = {
        ['Enabled'] = true,
        ['Skins'] = {
            ['[Double-Barrel SG]'] = 'Galaxy',
            ['[Revolver]'] = 'Galaxy',
            ['[TacticalShotgun]'] = 'Galaxy',
            ['[Knife]'] = 'Love Kukri',
        },
    },

    ['Character'] = {
        ['Appearance'] = {
            ['Enabled'] = true,
            ['Items'] = {
                '1744060292',
                '18670159818',
                '136783299613452',
            },
        },
    },

    ['Movement'] = {
        ['Walkspeed'] = {
            ['Enabled'] = true,
            ['Multiplier'] = 5,
            ['Bind'] = {
                ['Key'] = 'V',
                ['Type'] = 'Toggle',
            },
        },

        ['Jump Power'] = {
            ['Enabled'] = true,
            ['Multiplier'] = 5,
            ['Bind'] = {
                ['Key'] = 'V',
                ['Type'] = 'Toggle',
            },
        },

        ['Panic Ground'] = {
            ['Enabled'] = true,
            ['Bind'] = 'Z',
        },

        ['Trip'] = {
            ['Enabled'] = true
        },

        ['Jump'] = {
            ['Enabled'] = true
        },
    },

    ['Visuals'] = {
        ['Enabled'] = true,
        ['Name'] = {
            ['Enabled'] = true,
            ['Neutral'] = Color3.fromRGB(255, 255, 255),
            ['Target'] = Color3.fromRGB(255, 255, 255),
            ['Size'] = 13,
            ['Position'] = 'Bottom',
        },
    },
}`;
      tabs = [{ name:"config", code:defaultConfig }];
      active_tab = "config";
      render_tabs(active_tab);
      if (!editor_ready) init_monaco(tabs[0].code);
      else { editor.setValue(tabs[0].code); set_dirty(false); }
    }
  } catch(e) {
    // Fallback to default config
    const defaultConfig = `shared.coach = {
    ['Combat'] = {
        ['Silent Aim'] = {
            ['Enabled'] = true,
            ['Bone'] = 'Head',
            ['Bind'] = {
                ['Key'] = 'C',
                ['Type'] = 'Toggle',
                ['Mode'] = 'Target'
            },
            ['Fov'] = {
                ['Enabled'] = true,
                ['Size'] = 11150,
                ['Visuals'] = {
                    ['Enabled'] = true,
                    ['Color'] = Color3.fromRGB(255, 255, 255)
                },
            },
            ['Checks'] = {
                ['Visible'] = true,
                ['Dead'] = true,
                ['Field'] = true
            },
        },

        ['Aim Assist'] = {
            ['Enabled'] = true,
            ['Bone'] = 'Head',
            ['Bind'] = {
                ['Key'] = 'C',
                ['Type'] = 'Toggle',
            },
            ['Fov'] = {
                ['Enabled'] = true,
                ['Size'] = 11150,
                ['Visuals'] = {
                    ['Enabled'] = true,
                    ['Color'] = Color3.fromRGB(255, 255, 255)
                },
            },
            ["Smoothing"] = 0.05,
            ['Checks'] = {
                ['Visible'] = true,
                ['Dead'] = true,
                ['Field'] = true
            },
        },

        ['Triggerbot'] = {
            ['Enabled'] = true,
            ['Delay'] = 0.01,
            ['Bind'] = {
                ['Key'] = 'C',
                ['Type'] = 'Toggle',
            },
            ['Fov'] = {
                ['Enabled'] = true,
                ['Size'] = 11150,
                ['Visuals'] = {
                    ['Enabled'] = true,
                    ['Color'] = Color3.fromRGB(255, 255, 255)
                },
            },
            ['Tools'] = {
                ['Whitelisted'] = {
                    ['Enabled'] = true,
                    ['Items'] = {
                        '[Revolver]',
                        '[Double-Barrel SG]'
                    },
                },
                ['Blacklisted'] = {
                    ['Enabled'] = true,
                    ['Items'] = {
                        '[Knife]',
                    },
                },
            },
            ['Checks'] = {
                ['Visible'] = true,
                ['Dead'] = true,
                ['Field'] = true
            },
        },

        ['Spread Modifier'] = {
            ['Enabled'] = true,
            ['Spread'] = 0,
            ['Whitelisted'] = {
                ['Enabled'] = true,
                ['Items'] = {
                    '[Double-Barrel SG]',
                    '[Revolver]',
                    '[TacticalShotgun]',
                },
            },
        },

        ['Delay Modifier'] = {
            ['Enabled'] = true,
            ['Delay'] = 0,
            ['Whitelisted'] = {
                ['Enabled'] = true,
                ['Items'] = {
                    '[Double-Barrel SG]',
                    '[Revolver]',
                    '[TacticalShotgun]',
                },
            },
        },

        ['Hitbox Expander'] = {
            ['Enabled'] = true,
            ['Size'] = {
                ['X'] = 3,
                ['Y'] = 3,
                ['Z'] = 3
            },
        },

        ['Damage Override'] = {
            ['Enabled'] = true,
            ['Mode'] = 'Full',
        },
    },

    ['Skin Changer'] = {
        ['Enabled'] = true,
        ['Skins'] = {
            ['[Double-Barrel SG]'] = 'Galaxy',
            ['[Revolver]'] = 'Galaxy',
            ['[TacticalShotgun]'] = 'Galaxy',
            ['[Knife]'] = 'Love Kukri',
        },
    },

    ['Character'] = {
        ['Appearance'] = {
            ['Enabled'] = true,
            ['Items'] = {
                '1744060292',
                '18670159818',
                '136783299613452',
            },
        },
    },

    ['Movement'] = {
        ['Walkspeed'] = {
            ['Enabled'] = true,
            ['Multiplier'] = 5,
            ['Bind'] = {
                ['Key'] = 'V',
                ['Type'] = 'Toggle',
            },
        },

        ['Jump Power'] = {
            ['Enabled'] = true,
            ['Multiplier'] = 5,
            ['Bind'] = {
                ['Key'] = 'V',
                ['Type'] = 'Toggle',
            },
        },

        ['Panic Ground'] = {
            ['Enabled'] = true,
            ['Bind'] = 'Z',
        },

        ['Trip'] = {
            ['Enabled'] = true
        },

        ['Jump'] = {
            ['Enabled'] = true
        },
    },

    ['Visuals'] = {
        ['Enabled'] = true,
        ['Name'] = {
            ['Enabled'] = true,
            ['Neutral'] = Color3.fromRGB(255, 255, 255),
            ['Target'] = Color3.fromRGB(255, 255, 255),
            ['Size'] = 13,
            ['Position'] = 'Bottom',
        },
    },
}`;
    tabs = [{ name:"config", code:defaultConfig }];
    active_tab = "config";
    render_tabs(active_tab);
    if (!editor_ready) init_monaco(tabs[0].code);
    else { editor.setValue(tabs[0].code); set_dirty(false); }
  }
}

function make_av_fallback(n) { const el=document.createElement("div"); el.className="dash_avatar_fallback"; el.textContent=(n||"?").charAt(0).toUpperCase(); return el; }

function render_tabs(activate) {
  render_file_tree();
  update_export_dropdown_menu();
  if (activate) active_tab = activate;
}

function render_file_tree() {
  const tree = document.getElementById("file_tree");
  if (!tree) return;
  tree.innerHTML = "";
  tabs.forEach(t => {
    const item = document.createElement("div");
    item.className = "exec_config_item"+(t.name===active_tab?" active":"");
    item.innerHTML = `
      <svg viewbox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
      <span>${esc(t.name)}</span>
      <span class="exec_config_delete" onclick="event.stopPropagation();delete_tab('${esc(t.name)}')">&times;</span>
    `;
    item.onclick = () => switch_tab(t.name);
    tree.appendChild(item);
  });
}
function switch_tab(name) {
  if (name===active_tab) return;
  const cur = tabs.find(t=>t.name===active_tab);
  if (cur&&editor_ready) cur.code=editor.getValue();
  active_tab=name; const t=tabs.find(t=>t.name===name);
  if (t&&editor_ready) { editor.setValue(t.code); set_dirty(false); }
  render_tabs(name);
  const nameEl = document.getElementById("current_config_name");
  if (nameEl) nameEl.textContent = name;
  // Refresh visual settings if in visual mode
  if (currentViewMode === 'visual') {
    parse_and_render_config();
  }
}
async function add_tab() {
  const name = prompt("Enter config name:", "config");
  if (!name) return;
  if (tabs.find(t=>t.name===name)) {
    show_toast("Config name already exists", "error");
    return;
  }
  const defaultConfig = `shared.coach = {
    ['Combat'] = {
        ['Silent Aim'] = {
            ['Enabled'] = true,
            ['Bone'] = 'Head',
            ['Bind'] = {
                ['Key'] = 'C',
                ['Type'] = 'Toggle',
                ['Mode'] = 'Target'
            },
            ['Fov'] = {
                ['Enabled'] = true,
                ['Size'] = 11150,
                ['Visuals'] = {
                    ['Enabled'] = true,
                    ['Color'] = Color3.fromRGB(255, 255, 255)
                },
            },
            ['Checks'] = {
                ['Visible'] = true,
                ['Dead'] = true,
                ['Field'] = true
            },
        },

        ['Aim Assist'] = {
            ['Enabled'] = true,
            ['Bone'] = 'Head',
            ['Bind'] = {
                ['Key'] = 'C',
                ['Type'] = 'Toggle',
            },
            ['Fov'] = {
                ['Enabled'] = true,
                ['Size'] = 11150,
                ['Visuals'] = {
                    ['Enabled'] = true,
                    ['Color'] = Color3.fromRGB(255, 255, 255)
                },
            },
            ["Smoothing"] = 0.05,
            ['Checks'] = {
                ['Visible'] = true,
                ['Dead'] = true,
                ['Field'] = true
            },
        },

        ['Triggerbot'] = {
            ['Enabled'] = true,
            ['Delay'] = 0.01,
            ['Bind'] = {
                ['Key'] = 'C',
                ['Type'] = 'Toggle',
            },
            ['Fov'] = {
                ['Enabled'] = true,
                ['Size'] = 11150,
                ['Visuals'] = {
                    ['Enabled'] = true,
                    ['Color'] = Color3.fromRGB(255, 255, 255)
                },
            },
            ['Tools'] = {
                ['Whitelisted'] = {
                    ['Enabled'] = true,
                    ['Items'] = {
                        '[Revolver]',
                        '[Double-Barrel SG]'
                    },
                },
                ['Blacklisted'] = {
                    ['Enabled'] = true,
                    ['Items'] = {
                        '[Knife]',
                    },
                },
            },
            ['Checks'] = {
                ['Visible'] = true,
                ['Dead'] = true,
                ['Field'] = true
            },
        },

        ['Spread Modifier'] = {
            ['Enabled'] = true,
            ['Spread'] = 0,
            ['Whitelisted'] = {
                ['Enabled'] = true,
                ['Items'] = {
                    '[Double-Barrel SG]',
                    '[Revolver]',
                    '[TacticalShotgun]',
                },
            },
        },

        ['Delay Modifier'] = {
            ['Enabled'] = true,
            ['Delay'] = 0,
            ['Whitelisted'] = {
                ['Enabled'] = true,
                ['Items'] = {
                    '[Double-Barrel SG]',
                    '[Revolver]',
                    '[TacticalShotgun]',
                },
            },
        },

        ['Hitbox Expander'] = {
            ['Enabled'] = true,
            ['Size'] = {
                ['X'] = 3,
                ['Y'] = 3,
                ['Z'] = 3
            },
        },

        ['Damage Override'] = {
            ['Enabled'] = true,
            ['Mode'] = 'Full',
        },
    },

    ['Skin Changer'] = {
        ['Enabled'] = true,
        ['Skins'] = {
            ['[Double-Barrel SG]'] = 'Galaxy',
            ['[Revolver]'] = 'Galaxy',
            ['[TacticalShotgun]'] = 'Galaxy',
            ['[Knife]'] = 'Love Kukri',
        },
    },

    ['Character'] = {
        ['Appearance'] = {
            ['Enabled'] = true,
            ['Items'] = {
                '1744060292',
                '18670159818',
                '136783299613452',
            },
        },
    },

    ['Movement'] = {
        ['Walkspeed'] = {
            ['Enabled'] = true,
            ['Multiplier'] = 5,
            ['Bind'] = {
                ['Key'] = 'V',
                ['Type'] = 'Toggle',
            },
        },

        ['Jump Power'] = {
            ['Enabled'] = true,
            ['Multiplier'] = 5,
            ['Bind'] = {
                ['Key'] = 'V',
                ['Type'] = 'Toggle',
            },
        },

        ['Panic Ground'] = {
            ['Enabled'] = true,
            ['Bind'] = 'Z',
        },

        ['Trip'] = {
            ['Enabled'] = true
        },

        ['Jump'] = {
            ['Enabled'] = true
        },
    },

    ['Visuals'] = {
        ['Enabled'] = true,
        ['Name'] = {
            ['Enabled'] = true,
            ['Neutral'] = Color3.fromRGB(255, 255, 255),
            ['Target'] = Color3.fromRGB(255, 255, 255),
            ['Size'] = 13,
            ['Position'] = 'Bottom',
        },
    },
}`;
  tabs.push({name,code:defaultConfig});
  await api_post("/tabs/save",{name,code:defaultConfig});
  render_file_tree();
  render_tabs(name); if(editor_ready){editor.setValue(defaultConfig);set_dirty(false);} active_tab=name;
  const nameEl = document.getElementById("current_config_name");
  if (nameEl) nameEl.textContent = name;
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
  try { const data=await api_post("/tabs/save",{name:active_tab,code}); if(data.success){set_dirty(false);} else if(!silent)show_toast(data.message||"save failed","error"); }
  catch{ if(!silent)show_toast("could not reach server","error"); }
}
async function do_set() {
  if(!active_tab) return;
  await do_save();
  
  // Execute the code to Roblox
  const code = editor.getValue();
  
  try {
    const execData = await api_post("/execute", { code });
    
    if(execData.success){
      show_toast(`${active_tab} executed to Roblox`, "success");
    } else {
      show_toast(execData.error || "execution failed", "error");
    }
  } catch(err) {
    show_toast("execution failed: " + err.message, "error");
  }

  const data = await api_post("/tabs/set", { name: active_tab });
}

async function do_reset() {
  if (!active_tab) return;
  if (!confirm(`Reset "${active_tab}" to default?`)) return;
  const defaultConfig = `shared.coach = {
    ['Combat'] = {
        ['Silent Aim'] = {
            ['Enabled'] = true,
            ['Bone'] = 'Head',
            ['Bind'] = {
                ['Key'] = 'C',
                ['Type'] = 'Toggle',
                ['Mode'] = 'Target'
            },
            ['Fov'] = {
                ['Enabled'] = true,
                ['Size'] = 11150,
                ['Visuals'] = {
                    ['Enabled'] = true,
                    ['Color'] = Color3.fromRGB(255, 255, 255)
                },
            },
            ['Checks'] = {
                ['Visible'] = true,
                ['Dead'] = true,
                ['Field'] = true
            },
        },

        ['Aim Assist'] = {
            ['Enabled'] = true,
            ['Bone'] = 'Head',
            ['Bind'] = {
                ['Key'] = 'C',
                ['Type'] = 'Toggle',
            },
            ['Fov'] = {
                ['Enabled'] = true,
                ['Size'] = 11150,
                ['Visuals'] = {
                    ['Enabled'] = true,
                    ['Color'] = Color3.fromRGB(255, 255, 255)
                },
            },
            ["Smoothing"] = 0.05,
            ['Checks'] = {
                ['Visible'] = true,
                ['Dead'] = true,
                ['Field'] = true
            },
        },

        ['Triggerbot'] = {
            ['Enabled'] = true,
            ['Delay'] = 0.01,
            ['Bind'] = {
                ['Key'] = 'C',
                ['Type'] = 'Toggle',
            },
            ['Fov'] = {
                ['Enabled'] = true,
                ['Size'] = 11150,
                ['Visuals'] = {
                    ['Enabled'] = true,
                    ['Color'] = Color3.fromRGB(255, 255, 255)
                },
            },
            ['Tools'] = {
                ['Whitelisted'] = {
                    ['Enabled'] = true,
                    ['Items'] = {
                        '[Revolver]',
                        '[Double-Barrel SG]'
                    },
                },
                ['Blacklisted'] = {
                    ['Enabled'] = true,
                    ['Items'] = {
                        '[Knife]',
                    },
                },
            },
            ['Checks'] = {
                ['Visible'] = true,
                ['Dead'] = true,
                ['Field'] = true
            },
        },

        ['Spread Modifier'] = {
            ['Enabled'] = true,
            ['Spread'] = 0,
            ['Whitelisted'] = {
                ['Enabled'] = true,
                ['Items'] = {
                    '[Double-Barrel SG]',
                    '[Revolver]',
                    '[TacticalShotgun]',
                },
            },
        },

        ['Delay Modifier'] = {
            ['Enabled'] = true,
            ['Delay'] = 0,
            ['Whitelisted'] = {
                ['Enabled'] = true,
                ['Items'] = {
                    '[Double-Barrel SG]',
                    '[Revolver]',
                    '[TacticalShotgun]',
                },
            },
        },

        ['Hitbox Expander'] = {
            ['Enabled'] = true,
            ['Size'] = {
                ['X'] = 3,
                ['Y'] = 3,
                ['Z'] = 3
            },
        },

        ['Damage Override'] = {
            ['Enabled'] = true,
            ['Mode'] = 'Full',
        },
    },

    ['Skin Changer'] = {
        ['Enabled'] = true,
        ['Skins'] = {
            ['[Double-Barrel SG]'] = 'Galaxy',
            ['[Revolver]'] = 'Galaxy',
            ['[TacticalShotgun]'] = 'Galaxy',
            ['[Knife]'] = 'Love Kukri',
        },
    },

    ['Character'] = {
        ['Appearance'] = {
            ['Enabled'] = true,
            ['Items'] = {
                '1744060292',
                '18670159818',
                '136783299613452',
            },
        },
    },

    ['Movement'] = {
        ['Walkspeed'] = {
            ['Enabled'] = true,
            ['Multiplier'] = 5,
            ['Bind'] = {
                ['Key'] = 'V',
                ['Type'] = 'Toggle',
            },
        },

        ['Jump Power'] = {
            ['Enabled'] = true,
            ['Multiplier'] = 5,
            ['Bind'] = {
                ['Key'] = 'V',
                ['Type'] = 'Toggle',
            },
        },

        ['Panic Ground'] = {
            ['Enabled'] = true,
            ['Bind'] = 'Z',
        },

        ['Trip'] = {
            ['Enabled'] = true
        },

        ['Jump'] = {
            ['Enabled'] = true
        },
    },

    ['Visuals'] = {
        ['Enabled'] = true,
        ['Name'] = {
            ['Enabled'] = true,
            ['Neutral'] = Color3.fromRGB(255, 255, 255),
            ['Target'] = Color3.fromRGB(255, 255, 255),
            ['Size'] = 13,
            ['Position'] = 'Bottom',
        },
    },
}`;
  const t = tabs.find(t => t.name === active_tab);
  if (t) t.code = defaultConfig;
  if (editor_ready) { editor.setValue(defaultConfig); set_dirty(true); }
  await do_save();
  show_toast(`${active_tab} reset to default`, `success`);
}

function update_selected_btn() {
  const btn = document.getElementById("selected_cfg_btn");
  if (!btn) return;
  btn.textContent = selected_tab ? "&#9679; " + selected_tab : "no config set";
  btn.title = selected_tab ? "selected: " + selected_tab + " &mdash; click to open" : "no config set yet";
  btn.title=selected_tab?"selected: "+selected_tab+" &mdash; click to open":"no config set yet";
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
  const btn=document.getElementById("rename_btn"); btn.disabled=true; btn.textContent="renaming&hellip;";
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
  const btn=document.getElementById("publish_btn"); btn.disabled=true; btn.textContent="publishing&hellip;";
  document.getElementById("publish_err").textContent="";
  const data=await api_post("/marketplace/publish",{name,description:desc,code,password:pw});
  if(data.success){close_publish_modal();show_toast("published to marketplace","success");}
  else document.getElementById("publish_err").textContent=data.message||"failed.";
  btn.disabled=false; btn.textContent="publish";
}

async function load_marketplace(search="") {
  mp_current_search=search;
  const grid=document.getElementById("mp_grid"); grid.innerHTML='<div class="mp_loading">loading...';
  const params=new URLSearchParams({page:mp_current_page}); if(search)params.set("search",search);
  const data=await api_get("/marketplace/list?"+params);
  if(!data.success||!data.configs.length){grid.innerHTML='<div class="mp_empty">no configs found.';update_mp_pg(0,1,1);return;}
  grid.innerHTML="";
  data.configs.forEach(c=>{
    const card=document.createElement("div"); card.className="mp_card";
    const pin_icon = c.pinned ? `<span class="pin_badge_inline" title="pinned"><svg viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" stroke-width="2.5"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/>` : "";
    const lock_icon = c.has_password ? `<svg class="mp_card_icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--muted)"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>` : "";
    card.innerHTML=`
      <div class="mp_card_name">${pin_icon}<span class="mp_card_name_text">${esc(c.name)}${lock_icon}
      ${c.description?`<div class="mp_card_desc">${esc(c.description)}`:'<div style="flex:1">'}
      <div class="mp_card_footer">
        <span class="mp_card_author">${c.author_username?esc(c.author_username):"unknown"}
        <span class="mp_card_date">${new Date(c.updated_at).toLocaleDateString()}
      
      <div class="mp_card_actions"><button class="mp_btn mp_btn_view">view
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
  current_panel = panel;
  
  // Update nav tabs
  document.querySelectorAll(".exec_nav_btn").forEach(btn => btn.classList.remove("active"));
  const navBtns = {
    "editor": "nav_editor",
    "settings": "nav_settings",
    "admin": "nav_admin"
  };
  if (navBtns[panel]) {
    const btn = document.getElementById(navBtns[panel]);
    if (btn) btn.classList.add("active");
  }
  
  // Show/hide panels
  const mainEl=document.querySelector(".exec_main");
  const settingsEl=document.getElementById("settings_panel");
  const adminEl=document.getElementById("admin_panel");
  
  if (panel === "editor") {
    if(mainEl)mainEl.style.display="flex";
    if(settingsEl)settingsEl.style.display="none";
    if(adminEl)adminEl.style.display="none";
  } else if (panel === "settings") {
    if(mainEl)mainEl.style.display="none";
    if(settingsEl)settingsEl.style.display="block";
    if(adminEl)adminEl.style.display="none";
  } else if (panel === "admin") {
    if(mainEl)mainEl.style.display="none";
    if(settingsEl)settingsEl.style.display="none";
    if(adminEl)adminEl.style.display="flex";
    admin_users_page=1;load_admin_users();load_whitelist();
  }
}

function add_new_script() {
  add_tab();
}

function do_logout() {
  if(is_dirty&&!confirm("unsaved changes. log out anyway?"))return;
  window.location.href="/auth/logout";
}

// Settings functions
function update_font_size(size) {
  document.getElementById("font_size_value").textContent = size + "px";
  if (editor && editor_ready) {
    editor.updateOptions({ fontSize: parseInt(size) });
  }
  localStorage.setItem("editor_font_size", size);
}

function toggle_export_dropdown() {
  const dropdown = document.getElementById("export_dropdown");
  const isVisible = dropdown.style.display !== "none";
  dropdown.style.display = isVisible ? "none" : "block";
  
  if (!isVisible) {
    update_export_dropdown_menu();
  }
}

function update_export_dropdown_menu() {
  const dropdown = document.getElementById("export_dropdown");
  if (!dropdown) return;
  
  dropdown.innerHTML = '<div class="dropdown_item" onclick="export_config(\'all\')">all configs</div>';
  
  tabs.forEach(t => {
    const item = document.createElement("div");
    item.className = "dropdown_item";
    item.textContent = t.name;
    item.onclick = () => export_config(t.name);
    dropdown.appendChild(item);
  });
}

function export_config(configName) {
  const dropdown = document.getElementById("export_dropdown");
  dropdown.style.display = "none";
  
  if (tabs.length === 0) {
    show_toast("no configs to export", "error");
    return;
  }
  
  let configsToExport;
  let filename;
  
  if (configName === "all") {
    configsToExport = tabs;
    filename = `coach_configs_${new Date().toISOString().split("T")[0]}.json`;
  } else {
    const config = tabs.find(t => t.name === configName);
    if (!config) {
      show_toast("config not found", "error");
      return;
    }
    configsToExport = [config];
    filename = `coach_config_${config.name}_${new Date().toISOString().split("T")[0]}.json`;
  }
  
  const data = { configs: configsToExport, exported_at: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  show_toast(configName === "all" ? "all configs exported" : "config exported", "success");
}

async function import_configs(input) {
  const file = input.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.configs || !Array.isArray(data.configs)) {
      show_toast("invalid config file", "error");
      return;
    }
    
    if (!confirm(`import ${data.configs.length} configs? this will not overwrite existing configs.`)) return;
    
    let imported = 0;
    for (const config of data.configs) {
      if (!tabs.find(t => t.name === config.name)) {
        tabs.push(config);
        await api_post("/tabs/save", { name: config.name, code: config.code });
        imported++;
      }
    }
    
    render_file_tree();
    render_tabs(active_tab);
    show_toast(`${imported} configs imported`, "success");
  } catch (e) {
    show_toast("failed to import configs", "error");
  }
  input.value = "";
}

let whitelistData = [];
let currentEditingScript = null;

async function load_whitelist() {
  try {
    const data = await api_get("/admin/whitelist");
    if (!data.success) return;
    
    whitelistData = data.whitelist.users;
    render_whitelist(whitelistData);
  } catch (err) {
  }
}

function render_whitelist(whitelist) {
  const list = document.getElementById("whitelist_list");
  list.innerHTML = "";
  
  whitelist.forEach(row => {
    const discordId = row.discord_id;
    const item = document.createElement("div");
    item.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px";
    
    const isAdmin = discordId === whitelist.admin;
    
    item.innerHTML = `
      <span style="font-size:12px;color:var(--muted2);font-family:'Geist Mono',monospace">${esc(discordId)}${isAdmin ? ' <span style="color:#e5e5e5">(admin)</span>' : ''}</span>
      ${!isAdmin ? `<button onclick="remove_from_whitelist('${esc(discordId)}')" style="padding:4px 10px;border-radius:6px;font-size:11px;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.25);color:#f87171;cursor:pointer;transition:all 0.2s">remove</button>` : ''}
    `;
    list.appendChild(item);
  });
}

function filter_whitelist(search) {
  if (!search) {
    render_whitelist(whitelistData);
    return;
  }
  const filtered = whitelistData.filter(row => 
    row.discord_id.toLowerCase().includes(search.toLowerCase())
  );
  render_whitelist(filtered);
}

async function add_to_whitelist() {
  const input = document.getElementById("whitelist_add_input");
  const discordId = input.value.trim();
  
  if (!discordId) {
    show_toast("Please enter a Discord ID", "error");
    return;
  }
  
  try {
    const res = await api_post("/admin/whitelist/add", { discord_id: discordId });
    if (res.success) {
      show_toast("User added to whitelist", "success");
      input.value = "";
      load_whitelist();
    } else {
      show_toast(res.error || "Failed to add user", "error");
    }
  } catch (err) {
    show_toast("Failed to add user", "error");
  }
}

async function remove_from_whitelist(discordId) {
  if (!confirm(`Remove ${discordId} from whitelist?`)) return;
  
  try {
    const res = await api_post("/admin/whitelist/remove", { discord_id: discordId });
    if (res.success) {
      show_toast("User removed from whitelist", "success");
      load_whitelist();
    } else {
      show_toast(res.error || "Failed to remove user", "error");
    }
  } catch (err) {
    show_toast("Failed to remove user", "error");
  }
}

let admin_current_search = "";

async function load_admin_users() {
  const tbl=document.getElementById("admin_users_table"); tbl.innerHTML='<div class="mp_loading">loading...';
  const params=new URLSearchParams({page:admin_users_page}); if(admin_current_search)params.set("search",admin_current_search);
  const data=await api_get(`/admin/users?${params}`);
  if(!data.success||!data.users.length){tbl.innerHTML='<div class="mp_empty">no users found.';update_admin_users_pg(0,1,1);return;}
  tbl.innerHTML="";
  data.users.forEach(u=>{
    const display=u.global_name||u.username;
    const row=document.createElement("div"); row.className="admin_row";
    const key_short=u.user_key.slice(0,8)+"&hellip;";
    row.innerHTML=`
      <div class="admin_cell_user">
        <div id="au_av_${u.discord_id}">
        <div class="admin_user_info">
          <div class="admin_user_name">${esc(display)}${u.is_admin?ADMIN_BADGE_HTML:""}
          <div class="admin_user_handle">@${esc(u.username)}

      <div class="admin_cell_id">
        <span title="${esc(u.discord_id)}">${esc(u.discord_id)}
        <button class="admin_key_copy" onclick="copy_text('${esc(u.discord_id)}',this)">copy
      
      <div class="admin_cell_key">
        <span title="${esc(u.user_key)}">${esc(key_short)}
        <button class="admin_key_copy" onclick="copy_text('${esc(u.user_key)}',this)">copy
      
      <div class="admin_cell_date">${new Date(u.created_at).toLocaleDateString()}
      <div class="admin_actions">
        <button class="admin_action_btn admin_btn_hwid" onclick="admin_reset_hwid('${esc(u.user_key)}',this)">reset hwid
        <button class="admin_action_btn admin_btn_del"  onclick="admin_delete_user('${esc(u.discord_id)}','${esc(display)}',this)">delete
      
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
  const orig_html=btn.innerHTML; btn.innerHTML=btn.innerHTML.replace("generate key","generating&hellip;");
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
  navigator.clipboard.writeText(text).then(()=>{const o=btn.textContent;btn.textContent="&#10003;";setTimeout(()=>{btn.textContent=o;},1500);}).catch(()=>show_toast("press Ctrl+C to copy","info"));
}

async function admin_reset_hwid(user_key,btn) {
  if(!confirm("reset HWID for this user?"))return;
  btn.disabled=true; btn.textContent="resetting&hellip;";
  const data=await api_post("/admin/users/resethwid",{user_key});
  if(data.success)show_toast("HWID reset","success"); else show_toast(data.message||"failed","error");
  btn.disabled=false; btn.textContent="reset hwid";
}

async function admin_delete_user(discord_id,name,btn) {
  if(!confirm(`Delete "${name}"?\n\nThis removes them from Luarmor, deletes all their tabs, and removes all their marketplace posts.`))return;
  btn.disabled=true; btn.textContent="deleting&hellip;";
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
    monaco.editor.defineTheme("coachDark",{
      base:"vs-dark",inherit:true,
      rules:[{token:"comment",foreground:"6b6880",fontStyle:"italic"},{token:"keyword",foreground:"ffffff"},{token:"string",foreground:"7dd3fc"},{token:"number",foreground:"f9a8d4"},{token:"type",foreground:"6ee7b7"}],
      colors:{"editor.background":"#0a0a0b","editor.foreground":"#d4d0e8","editor.lineHighlightBackground":"#ffffff06","editorLineNumber.foreground":"#2a2733","editorLineNumber.activeForeground":"#ffffff","editor.selectionBackground":"#ffffff15","editorCursor.foreground":"#ffffff","scrollbarSlider.background":"#ffffff06","scrollbarSlider.hoverBackground":"#ffffff0e","minimap.background":"#0a0a0b","editorWidget.background":"#0f0f12","editorWidget.border":"#ffffff20","input.background":"#0f0f12","input.foreground":"#d4d0e8","focusBorder":"#ffffff30"}
    });
    editor=monaco.editor.create(document.getElementById("editor_container"),{
      value:initial_code,language:"lua",theme:"coachDark",
      fontSize:parseInt(localStorage.getItem("editor_font_size")||"13"),
      fontFamily:"'Geist Mono','JetBrains Mono','Fira Code','Consolas',monospace",
      fontLigatures:true,minimap:{enabled:true,scale:1,renderCharacters:false},
      scrollBeyondLastLine:false,padding:{top:20,bottom:20},lineNumbers:"on",
      renderLineHighlight:"line",cursorBlinking:"smooth",cursorSmoothCaretAnimation:"on",
      smoothScrolling:true,automaticLayout:true,wordWrap:"off",tabSize:2,
      bracketPairColorization:{enabled:true},
    });
    // Update slider to match loaded font size
    const savedSize = localStorage.getItem("editor_font_size")||"13";
    document.getElementById("font_size_slider").value = savedSize;
    document.getElementById("font_size_value").textContent = savedSize + "px";
    editor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.KeyS,do_save);
    editor.onDidChangeModelContent(()=>{
      set_dirty(true); clearTimeout(window._autosave);
      window._autosave=setTimeout(()=>{if(is_dirty)do_save(true);},1500);
    });
    editor_ready=true; set_dirty(false);
  });
}

function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

const publishBtn = document.getElementById("publish_btn"); if(publishBtn)publishBtn.addEventListener("click",do_publish);
const renameBtn = document.getElementById("rename_btn"); if(renameBtn)renameBtn.addEventListener("click",do_rename);
const renameInput = document.getElementById("rename_input"); if(renameInput)renameInput.addEventListener("keydown",e=>{if(e.key==="Enter")do_rename();});
const mpSearch = document.getElementById("mp_search"); if(mpSearch)mpSearch.addEventListener("input",e=>{clearTimeout(window._mp_timer);mp_current_page=1;window._mp_timer=setTimeout(()=>load_marketplace(e.target.value),300);});
const adminSearch = document.getElementById("admin_search"); if(adminSearch)adminSearch.addEventListener("input",e=>{clearTimeout(window._adm_timer);admin_users_page=1;admin_current_search=e.target.value.trim();window._adm_timer=setTimeout(()=>load_admin_users(),300);});
const viewPwInput = document.getElementById("view_pw_input"); if(viewPwInput)viewPwInput.addEventListener("keydown",e=>{if(e.key==="Enter")do_view_import();});
const publishDesc = document.getElementById("publish_desc"); if(publishDesc)publishDesc.addEventListener("input",function(){const cnt=document.getElementById("publish_desc_count"); if(cnt)cnt.textContent=this.value.length;});
window.addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==="s"&&editor_ready){e.preventDefault();do_save();}
  if(e.key==="Escape"){close_publish_modal();close_rename_modal();close_view_modal();close_keygen_modal();}
});

/* Visual Settings Panel */
let currentViewMode = 'visual'; // 'visual' or 'code'
let parsedConfig = {};

function toggle_editor_view() {
  const editorContainer = document.querySelector('.exec_editor');
  const visualPanel = document.getElementById('visual_settings_panel');
  const btn = document.querySelector('.vs_toggle_view');

  if (currentViewMode === 'visual') {
    // Switch to code view
    currentViewMode = 'code';
    editorContainer.style.display = 'flex';
    visualPanel.style.display = 'none';
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 12l2 2 4-4"></path></svg> visual view`;
  } else {
    // Switch to visual view
    currentViewMode = 'visual';
    editorContainer.style.display = 'none';
    visualPanel.style.display = 'block';
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> code view`;
    parse_and_render_config();
  }
}

function parse_lua_config(code) {
  // Simple parser for the config structure
  const config = {};
  const lines = code.split('\n');
  let currentCategory = null;
  let currentSection = null;
  let currentSubSection = null;
  let depth = 0;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--')) continue;

    // Count leading tabs/spaces for depth
    const leading = line.match(/^[\t]*/)[0];
    depth = leading.length;

    // Category: ['Name'] = {
    const catMatch = trimmed.match(/^\['([^']+)'\]\s*=\s*\{/);
    if (catMatch && depth === 1) {
      currentCategory = catMatch[1];
      config[currentCategory] = {};
      currentSection = null;
      currentSubSection = null;
      continue;
    }

    // Section: ['Name'] = {
    const secMatch = trimmed.match(/^\['([^']+)'\]\s*=\s*\{/);
    if (secMatch && depth === 2 && currentCategory) {
      currentSection = secMatch[1];
      config[currentCategory][currentSection] = {};
      currentSubSection = null;
      continue;
    }

    // SubSection: ['Name'] = {
    const subMatch = trimmed.match(/^\['([^']+)'\]\s*=\s*\{/);
    if (subMatch && depth === 3 && currentSection) {
      currentSubSection = subMatch[1];
      config[currentCategory][currentSection][currentSubSection] = {};
      continue;
    }

    // Key-value pairs at different depths
    const kvMatch = trimmed.match(/^\['([^']+)'\]\s*=\s*(.+?)(?:,|$)/);
    if (kvMatch) {
      const key = kvMatch[1];
      let value = kvMatch[2].trim();

      // Parse value
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(value) && value !== '') value = Number(value);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      else if (value.startsWith('Color3.fromRGB')) {
        const rgb = value.match(/\d+/g);
        if (rgb) value = { r: parseInt(rgb[0]), g: parseInt(rgb[1]), b: parseInt(rgb[2]) };
      }

      if (currentSubSection && typeof config[currentCategory][currentSection][currentSubSection] === 'object') {
        config[currentCategory][currentSection][currentSubSection][key] = value;
      } else if (currentSection && typeof config[currentCategory][currentSection] === 'object') {
        config[currentCategory][currentSection][key] = value;
      } else if (currentCategory) {
        config[currentCategory][key] = value;
      }
    }

    // Array items
    const arrMatch = trimmed.match(/^'([^']+)'/);
    if (arrMatch && depth >= 4) {
      const item = arrMatch[1];
      if (currentSubSection) {
        if (!config[currentCategory][currentSection][currentSubSection].items) {
          config[currentCategory][currentSection][currentSubSection].items = [];
        }
        config[currentCategory][currentSection][currentSubSection].items.push(item);
      }
    }
  }

  return config;
}

function parse_and_render_config() {
  if (!editor_ready || !active_tab) return;

  const code = editor.getValue();
  parsedConfig = parse_lua_config(code);
  render_visual_settings(parsedConfig);
}

function render_visual_settings(config) {
  const container = document.getElementById('vs_categories');
  container.innerHTML = '';

  const categoryOrder = ['Combat', 'Skin Changer', 'Character', 'Movement', 'Visuals'];
  const categoryIcons = {
    'Combat': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18v-6"></path><path d="M9 15l3-3 3 3"></path></svg>`,
    'Skin Changer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>`,
    'Character': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    'Movement': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`,
    'Visuals': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
  };

  categoryOrder.forEach(catName => {
    if (!config[catName]) return;

    const catDiv = document.createElement('div');
    catDiv.className = 'vs_category';

    const header = document.createElement('div');
    header.className = 'vs_cat_header';
    header.innerHTML = `${categoryIcons[catName] || ''}<span class="vs_cat_title">${catName}</span>`;
    header.onclick = () => toggle_category(catDiv);

    const content = document.createElement('div');
    content.className = 'vs_cat_content';
    content.id = `vs_cat_${catName}`;

    // Render sections
    Object.entries(config[catName]).forEach(([secName, secData]) => {
      if (typeof secData === 'object' && secData !== null) {
        content.appendChild(render_section(catName, secName, secData));
      } else {
        // Simple key-value at category level
        const row = create_row(catName, secName, secData, null);
        content.appendChild(row);
      }
    });

    catDiv.appendChild(header);
    catDiv.appendChild(content);
    container.appendChild(catDiv);
  });
}

function render_section(category, name, data) {
  const section = document.createElement('div');
  section.className = 'vs_section';

  const hasEnabled = data.hasOwnProperty('Enabled');

  const header = document.createElement('div');
  header.className = 'vs_section_header';
  header.innerHTML = `<span class="vs_section_title">${name}</span>`;

  if (hasEnabled) {
    const toggle = create_toggle(category, name, 'Enabled', data['Enabled']);
    header.appendChild(toggle);
  }

  section.appendChild(header);

  const content = document.createElement('div');
  content.className = 'vs_section_content';

  Object.entries(data).forEach(([key, value]) => {
    if (key === 'Enabled') return;

    if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value.r !== undefined)) {
      // Nested object - render as subsection
      const subSection = render_subsection(category, name, key, value);
      content.appendChild(subSection);
    } else {
      const row = create_row(category, key, value, name);
      content.appendChild(row);
    }
  });

  section.appendChild(content);
  return section;
}

function render_subsection(category, section, name, data) {
  const sub = document.createElement('div');
  sub.className = 'vs_nested';

  const subSection = document.createElement('div');
  subSection.className = 'vs_section';

  const header = document.createElement('div');
  header.className = 'vs_section_header';
  header.innerHTML = `<span class="vs_section_title" style="font-size:12px;color:var(--muted)">${name}</span>`;

  if (data.hasOwnProperty('Enabled')) {
    const toggle = create_toggle(category, section, 'Enabled', data['Enabled'], name);
    header.appendChild(toggle);
  }

  subSection.appendChild(header);

  const content = document.createElement('div');
  content.className = 'vs_section_content';

  Object.entries(data).forEach(([key, value]) => {
    if (key === 'Enabled') return;

    if (key === 'Items' || (Array.isArray(value) && typeof value[0] === 'string')) {
      // Array of items
      const itemsDiv = document.createElement('div');
      itemsDiv.className = 'vs_items';
      const items = Array.isArray(value) ? value : (value.items || []);
      items.forEach(item => {
        const span = document.createElement('span');
        span.className = 'vs_item';
        span.textContent = item;
        itemsDiv.appendChild(span);
      });
      content.appendChild(itemsDiv);
    } else if (typeof value === 'object' && value !== null) {
      // Deeper nesting
      const row = create_row(category, key, value, section, name);
      content.appendChild(row);
    } else {
      const row = create_row(category, key, value, section, name);
      content.appendChild(row);
    }
  });

  subSection.appendChild(content);
  sub.appendChild(subSection);
  return sub;
}

function create_row(category, key, value, section = null, subsection = null) {
  const row = document.createElement('div');
  row.className = 'vs_row';

  const label = document.createElement('div');
  label.className = 'vs_label';
  label.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="1"></circle></svg>${key}`;
  row.appendChild(label);

  const control = create_control(category, key, value, section, subsection);
  row.appendChild(control);

  return row;
}

function create_control(category, key, value, section, subsection) {
  if (typeof value === 'boolean') {
    return create_toggle(category, section, key, value, subsection);
  } else if (typeof value === 'number') {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'vs_input vs_input_small';
    input.value = value;
    input.step = key.toLowerCase().includes('smooth') ? 0.01 : 1;
    input.onchange = () => update_config_value(category, section, key, parseFloat(input.value), subsection);
    return input;
  } else if (typeof value === 'string') {
    if (key === 'Key' || key === 'Bind') {
      // Keybind
      const keybind = document.createElement('div');
      keybind.className = 'vs_keybind';
      keybind.textContent = value;
      keybind.onclick = () => record_keybind(keybind, category, section, key, subsection);
      return keybind;
    } else if (['Bone', 'Mode', 'Type', 'Position'].includes(key)) {
      // Select dropdown
      const select = document.createElement('select');
      select.className = 'vs_select';
      const options = {
        'Bone': ['Head', 'HumanoidRootPart', 'Torso'],
        'Mode': ['Target', 'Full', 'Display'],
        'Type': ['Toggle', 'Hold', 'Always'],
        'Position': ['Top', 'Bottom', 'Left', 'Right']
      };
      (options[key] || []).forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === value) option.selected = true;
        select.appendChild(option);
      });
      select.onchange = () => update_config_value(category, section, key, select.value, subsection);
      return select;
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'vs_input';
      input.value = value;
      input.onchange = () => update_config_value(category, section, key, input.value, subsection);
      return input;
    }
  } else if (value && value.r !== undefined) {
    // Color3
    const color = document.createElement('input');
    color.type = 'color';
    color.className = 'vs_input_color';
    color.value = `#${value.r.toString(16).padStart(2,'0')}${value.g.toString(16).padStart(2,'0')}${value.b.toString(16).padStart(2,'0')}`;
    color.onchange = () => {
      const hex = color.value.slice(1);
      const r = parseInt(hex.slice(0,2), 16);
      const g = parseInt(hex.slice(2,4), 16);
      const b = parseInt(hex.slice(4,6), 16);
      update_config_value(category, section, key, {r,g,b}, subsection);
    };
    return color;
  }

  const span = document.createElement('span');
  span.className = 'vs_value';
  span.textContent = JSON.stringify(value);
  return span;
}

function create_toggle(category, section, key, value, subsection = null) {
  const toggle = document.createElement('div');
  toggle.className = `vs_toggle ${value ? 'active' : ''}`;
  toggle.onclick = () => {
    const newValue = !toggle.classList.contains('active');
    toggle.classList.toggle('active');
    update_config_value(category, section, key, newValue, subsection);
  };
  return toggle;
}

let recordingKeybind = null;

function record_keybind(element, category, section, key, subsection) {
  if (recordingKeybind) {
    recordingKeybind.classList.remove('recording');
  }
  recordingKeybind = element;
  element.classList.add('recording');
  element.textContent = 'press key...';

  const handler = (e) => {
    e.preventDefault();
    const newKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    element.textContent = newKey;
    element.classList.remove('recording');
    update_config_value(category, section, key, newKey, subsection);
    document.removeEventListener('keydown', handler);
    recordingKeybind = null;
  };

  document.addEventListener('keydown', handler, { once: true });
}

function toggle_category(catDiv) {
  const header = catDiv.querySelector('.vs_cat_header');
  const content = catDiv.querySelector('.vs_cat_content');
  header.classList.toggle('collapsed');
  content.classList.toggle('collapsed');
}

function update_config_value(category, section, key, value, subsection = null) {
  if (!editor_ready) return;

  let code = editor.getValue();
  let path = [category];
  if (section) path.push(section);
  if (subsection) path.push(subsection);
  path.push(key);

  // Build regex pattern to find the value
  let pattern = '';
  for (let i = 0; i < path.length; i++) {
    if (i > 0) pattern += '[\\s\\S]*?';
    pattern += `\\['${path[i]}'\\]\\s*=\\s*`;
  }

  let replacement;
  if (typeof value === 'boolean') {
    replacement = value.toString();
  } else if (typeof value === 'number') {
    replacement = value.toString();
  } else if (typeof value === 'string') {
    replacement = `'${value}'`;
  } else if (value && value.r !== undefined) {
    replacement = `Color3.fromRGB(${value.r}, ${value.g}, ${value.b})`;
  } else {
    replacement = JSON.stringify(value);
  }

  const fullPattern = new RegExp(`(${pattern})([^,\n]+)`, 'g');
  code = code.replace(fullPattern, `$1${replacement}`);

  editor.setValue(code);
  set_dirty(true);
}

// Auto-switch to visual view on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (editor_ready && currentViewMode === 'visual') {
      const editorContainer = document.querySelector('.exec_editor');
      const visualPanel = document.getElementById('visual_settings_panel');
      if (editorContainer && visualPanel) {
        editorContainer.style.display = 'none';
        visualPanel.style.display = 'block';
        parse_and_render_config();
      }
    }
  }, 500);
});

check_auth();