import { useEffect, useState } from 'react';
import { Copy, MessageCircle, Check } from 'lucide-react';
import { Sheet } from './Sheet.jsx';
import { Avatar } from './bits.jsx';

export function InviteSheet({ member, tripName, onClose, onSent }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => setCopied(false), [member]);
  const open = !!member;
  const msg = member
    ? `Hey ${member.name}, I'm tracking ${tripName} on Squad Mode. If you get a Scapia card, your card spends get split as you pay, no typing them in later. Zero joining fee, and you earn coins on the trip: scapia.cards/invite/sq-4417`
    : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg);
    } catch {
      /* clipboard blocked in some frames; the message is still visible to copy by hand */
    }
    setCopied(true);
  };

  return (
    <Sheet open={open} onClose={onClose} labelledBy="invite-sheet-h">
      {member ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 48 }}>
            <Avatar member={member} showCard={false} />
            <h2 id="invite-sheet-h">Invite {member.name}</h2>
          </div>
          <p className="custom-note" style={{ marginTop: 10 }}>
            Until then, {member.name}&rsquo;s spends still count. Anyone can add them as cash or UPI.
          </p>
          <div className="plain-card" style={{ background: 'var(--ground)', marginTop: 14 }}>
            <p style={{ color: 'var(--ink)', fontSize: 15.5 }}>{msg}</p>
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            <button type="button" className="btn btn-ink btn-block" onClick={() => onSent(member)} data-autofocus>
              <MessageCircle size={18} aria-hidden="true" /> Send on WhatsApp
            </button>
            <button type="button" className="btn btn-soft btn-block" onClick={copy}>
              {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy message'}
            </button>
          </div>
          <p className="custom-note" style={{ fontSize: 13 }}>Mock invite. Nothing is sent from this prototype.</p>
        </div>
      ) : null}
    </Sheet>
  );
}
