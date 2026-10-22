import json,sys
for f in sys.argv[1:]:
    print("=====",f)
    for line in open(f,encoding='utf-8'):
        try: ev=json.loads(line)
        except json.JSONDecodeError: continue
        t=ev.get('type')
        if t=='system' and ev.get('subtype')=='init':
            print("[init] permissionMode=",ev.get('permissionMode'),"model=",ev.get('model'))
        msg=ev.get('message'); msg=msg if isinstance(msg,dict) else {}
        for c in (msg.get('content') or []) if isinstance(msg.get('content'),list) else []:
            if c.get('type')=='tool_use': print("[tool_use]",c['name'],json.dumps(c['input'],ensure_ascii=False))
            if c.get('type')=='tool_result':
                cont=c.get('content'); 
                if isinstance(cont,list): cont=" ".join(x.get('text','') for x in cont)
                print("[tool_result] is_error=",c.get('is_error'),"|",str(cont)[:400])
        if t=='result':
            print("[result]",ev.get('subtype'),"| denials=",json.dumps(ev.get('permission_denials'),ensure_ascii=False)[:500])
            print("[final]",str(ev.get('result'))[:600])
