"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Conversation = {
  id: string;
  title?: string | null;
  type: string;
  unreadCount?: number;
  myLastReadAt?: string | null;
  members: Array<{
    user: {
      id: string;
      fullName: string;
      role?: string | null;
    };
  }>;
  messages: Array<{
    text?: string | null;
    fileName?: string | null;
    createdAt: string;
  }>;
};

type UserItem = {
  id: string;
  fullName: string;
  role: string;
  email?: string | null;
};

type PresenceItem = {
  user: {
    id: string;
    fullName: string;
  };
  status: string;
  lastSeenAt?: string | null;
};

type Message = {
  id: string;
  parentId?: string | null;
  text?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  createdAt: string;
  sender: {
    id?: string;
    fullName: string;
  };
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
    user?: {
      id: string;
      fullName: string;
    };
  }>;
  _count?: {
    replies?: number;
  };
};

type TypingItem = {
  user: {
    id: string;
    fullName: string;
  };
};

type SearchMessage = {
  id: string;
  text?: string | null;
  createdAt: string;
  sender: {
    fullName: string;
  };
};

function apiError(data: any, fallback: string) {
  return String(data?.error || data?.message || fallback);
}

function displayTime(date: string) {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const reactionChoices = ["👍", "❤️", "✅", "🔥", "👏"];

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [presence, setPresence] = useState<PresenceItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadMessages, setThreadMessages] = useState<Record<string, Message[]>>({});
  const [openThreadId, setOpenThreadId] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [typingItems, setTypingItems] = useState<TypingItem[]>([]);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMessage[]>([]);
  const [editingId, setEditingId] = useState("");
  const [editingText, setEditingText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastTypingPingRef = useRef(0);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const presenceMap = useMemo(() => {
    return new Map(presence.map((item) => [item.user.id, item.status]));
  }, [presence]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q) ||
        String(user.email ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const filteredConversations = useMemo(() => {
    const q = conversationSearch.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((conversation) => {
      const titleText = conversation.title || conversation.members.map((m) => m.user.fullName).join(", ");
      const last = conversation.messages?.[0]?.text || conversation.messages?.[0]?.fileName || "";
      return `${titleText} ${last}`.toLowerCase().includes(q);
    });
  }, [conversationSearch, conversations]);

  const conversationTitle = selectedConversation
    ? selectedConversation.title || selectedConversation.members.map((m) => m.user.fullName).join(", ")
    : "Aucune conversation";

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/chat/conversations", { cache: "no-store", credentials: "include" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) throw new Error(apiError(data, "Chargement conversations impossible"));

    setConversations(data.conversations || []);
    setSelectedId((current) => current || data.conversations?.[0]?.id || "");
  }, []);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/chat/users", { cache: "no-store", credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (data?.ok) setUsers(data.users || []);
  }, []);

  const loadPresence = useCallback(async () => {
    const res = await fetch("/api/chat/presence", { cache: "no-store", credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (data?.ok) setPresence(data.items || []);
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    if (!id) return;

    const res = await fetch(`/api/chat/conversations/${id}/messages`, {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) throw new Error(apiError(data, "Chargement messages impossible"));
    setMessages(data.messages || []);
  }, []);

  const markRead = useCallback(async (id: string) => {
    if (!id) return;
    await fetch(`/api/chat/conversations/${id}/read`, {
      method: "POST",
      credentials: "include",
    });
  }, []);

  const loadTyping = useCallback(async (id: string) => {
    if (!id) return;

    const res = await fetch(`/api/chat/conversations/${id}/typing`, {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (data?.ok) setTypingItems(data.items || []);
  }, []);

  const loadThread = useCallback(async (messageId: string) => {
    if (!selectedId || !messageId) return;

    const res = await fetch(`/api/chat/conversations/${selectedId}/messages?parentId=${messageId}`, {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) throw new Error(apiError(data, "Chargement du fil impossible"));
    setThreadMessages((current) => ({ ...current, [messageId]: data.messages || [] }));
  }, [selectedId]);

  const sendTyping = useCallback(async (active: boolean) => {
    if (!selectedId) return;

    await fetch(`/api/chat/conversations/${selectedId}/typing`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
  }, [selectedId]);

  const pingPresence = useCallback(async () => {
    await fetch("/api/chat/presence", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ONLINE", device: "WEB" }),
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        setError(null);
        await Promise.all([loadConversations(), loadUsers(), loadPresence(), pingPresence()]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Chargement impossible");
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, [loadConversations, loadPresence, loadUsers, pingPresence]);

  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;

    async function refreshSelected() {
      try {
        await loadMessages(selectedId);
        await markRead(selectedId);
        await loadTyping(selectedId);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Chargement messages impossible");
      }
    }

    refreshSelected();

    return () => {
      cancelled = true;
    };
  }, [loadMessages, loadTyping, markRead, selectedId]);

  useEffect(() => {
    setReplyTo(null);
    setOpenThreadId("");
    setThreadMessages({});
  }, [selectedId]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      await pingPresence();
      await loadPresence();
      await loadConversations();
      if (selectedId) {
        await loadMessages(selectedId);
        await loadTyping(selectedId);
      }
    }, 12000);

    return () => window.clearInterval(timer);
  }, [loadConversations, loadMessages, loadPresence, loadTyping, pingPresence, selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedId]);

  async function createConversation(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type: memberIds.length > 1 ? "GROUP" : "DIRECT",
          memberIds,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(apiError(data, "Création impossible"));

      setTitle("");
      setMemberIds([]);
      await loadConversations();
      if (data.id) setSelectedId(data.id);
      setInfo("Conversation créée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible");
    } finally {
      setBusy(false);
    }
  }

  async function createDirect(userId: string) {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(apiError(data, "Conversation directe impossible"));

      await loadConversations();
      setSelectedId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversation directe impossible");
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || (!text.trim() && !fileUrl.trim())) return;

    const draft = { text, fileUrl, fileName, parentId: replyTo?.id || null };
    setText("");
    setFileUrl("");
    setFileName("");
    setReplyTo(null);
    setError(null);

    try {
      const res = await fetch(`/api/chat/conversations/${selectedId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(apiError(data, "Envoi impossible"));

      await loadMessages(selectedId);
      if (draft.parentId) await loadThread(draft.parentId);
      await loadConversations();
      await sendTyping(false);
    } catch (e) {
      setText(draft.text);
      setFileUrl(draft.fileUrl);
      setFileName(draft.fileName);
      setReplyTo(replyTo);
      setError(e instanceof Error ? e.message : "Envoi impossible");
    }
  }

  async function uploadAttachment(file: File | null) {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(apiError(data, "Upload impossible"));
      }

      setFileUrl(data.url || "");
      setFileName(data.fileName || file.name);
      setInfo("Fichier ajouté au message.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload impossible");
    } finally {
      setUploading(false);
    }
  }

  async function searchMessages() {
    if (!messageSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const res = await fetch(`/api/chat/search?q=${encodeURIComponent(messageSearch)}`, {
      cache: "no-store",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (data?.ok) setSearchResults(data.messages || []);
  }

  async function updateMessage(id: string) {
    const res = await fetch(`/api/chat/messages/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editingText }),
    });

    const data = await res.json().catch(() => ({}));
    if (data?.ok) {
      setEditingId("");
      setEditingText("");
      await loadMessages(selectedId);
    } else {
      setError(apiError(data, "Modification impossible"));
    }
  }

  async function deleteMessage(id: string) {
    const ok = window.confirm("Supprimer ce message ?");
    if (!ok) return;

    const res = await fetch(`/api/chat/messages/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (data?.ok) {
      await loadMessages(selectedId);
      await loadConversations();
    } else {
      setError(apiError(data, "Suppression impossible"));
    }
  }

  async function toggleThread(messageId: string) {
    if (openThreadId === messageId) {
      setOpenThreadId("");
      return;
    }

    setOpenThreadId(messageId);
    try {
      await loadThread(messageId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement du fil impossible");
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const res = await fetch(`/api/chat/messages/${messageId}/reactions`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      setError(apiError(data, "Réaction impossible"));
      return;
    }

    await loadMessages(selectedId);
    if (openThreadId) await loadThread(openThreadId);
  }

  function reactionSummary(message: Message) {
    const counts = new Map<string, number>();
    for (const reaction of message.reactions || []) {
      counts.set(reaction.emoji, (counts.get(reaction.emoji) || 0) + 1);
    }

    return Array.from(counts.entries());
  }

  function changeComposerText(value: string) {
    setText(value);

    const now = Date.now();
    if (now - lastTypingPingRef.current < 2500) return;

    lastTypingPingRef.current = now;
    void sendTyping(Boolean(value.trim()));
  }

  function toggleMember(id: string) {
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function presenceDot(userId: string) {
    const status = presenceMap.get(userId);
    if (status === "ONLINE") return "bg-green-500";
    if (status === "AWAY") return "bg-yellow-500";
    return "bg-zinc-500";
  }

  function lastMessage(conversation: Conversation) {
    const last = conversation.messages?.[0];
    return last?.text || last?.fileName || "Aucun message";
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white md:p-6">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-[320px_1fr_280px]">
        <aside className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Messagerie</h1>
              <p className="text-xs text-zinc-400">Conversations internes</p>
            </div>
            <button
              type="button"
              onClick={() => void loadConversations()}
              className="rounded-xl bg-white/10 px-3 py-2 text-xs ring-1 ring-white/10 hover:bg-white/15"
            >
              Actualiser
            </button>
          </div>

          <input
            value={conversationSearch}
            onChange={(e) => setConversationSearch(e.target.value)}
            placeholder="Filtrer les conversations"
            className="mt-4 w-full rounded-xl bg-zinc-950/40 p-3 text-sm ring-1 ring-white/10"
          />

          <div className="mt-4 max-h-[68vh] space-y-2 overflow-auto pr-1">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
                className={`w-full rounded-xl p-3 text-left ring-1 transition ${
                  selectedId === conversation.id
                    ? "bg-amber-400/15 ring-amber-300/30"
                    : "bg-zinc-950/40 ring-white/10 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-medium">
                    {conversation.title || conversation.members.map((m) => m.user.fullName).join(", ")}
                  </div>
                  {(conversation.unreadCount ?? 0) > 0 ? (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] text-white">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 truncate text-xs text-zinc-400">{lastMessage(conversation)}</div>
              </button>
            ))}

            {filteredConversations.length === 0 ? (
              <div className="rounded-xl bg-zinc-950/40 p-4 text-sm text-zinc-400 ring-1 ring-white/10">
                Aucune conversation.
              </div>
            ) : null}
          </div>
        </aside>

        <section className="flex min-h-[76vh] flex-col rounded-2xl bg-white/5 ring-1 ring-white/10">
          <header className="border-b border-white/10 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{conversationTitle}</h2>
                <p className="text-xs text-zinc-400">
                  {selectedConversation?.members.length ?? 0} membre(s)
                </p>
              </div>
              {selectedId ? (
                <a
                  href={`/api/chat/export/messages?conversationId=${selectedId}`}
                  className="rounded-xl bg-amber-400/90 px-4 py-2 text-sm font-semibold text-zinc-950"
                >
                  Export CSV
                </a>
              ) : null}
            </div>

            {error ? (
              <div className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/20">
                {error}
              </div>
            ) : null}
            {info ? (
              <div className="mt-3 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200 ring-1 ring-emerald-400/20">
                {info}
              </div>
            ) : null}
          </header>

          <div className="flex-1 overflow-auto p-4">
            {messages.map((message) => (
              <div key={message.id} className="mb-3 rounded-2xl bg-zinc-950/40 p-3 ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{message.sender.fullName}</div>
                    <div className="text-[11px] text-zinc-400">{displayTime(message.createdAt)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyTo(message)}
                      className="rounded-lg bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
                    >
                      Répondre
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(message.id);
                        setEditingText(message.text || "");
                      }}
                      className="rounded-lg bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMessage(message.id)}
                      className="rounded-lg bg-red-600/80 px-2 py-1 text-xs text-white"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {editingId === message.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full rounded-xl bg-black/30 p-3 text-sm ring-1 ring-white/10"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => updateMessage(message.id)} className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white">
                        Sauver
                      </button>
                      <button type="button" onClick={() => setEditingId("")} className="rounded-lg bg-white/10 px-3 py-1 text-sm">
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {message.text ? <div className="mt-3 whitespace-pre-wrap text-sm">{message.text}</div> : null}
                    {message.fileUrl ? (
                      <a href={message.fileUrl} className="mt-3 inline-flex rounded-xl bg-white/10 px-3 py-2 text-sm text-amber-200 ring-1 ring-white/10 hover:bg-white/15">
                        {message.fileName || "Pièce jointe"}
                      </a>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {reactionSummary(message).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => toggleReaction(message.id, emoji)}
                          className="rounded-full bg-white/10 px-2 py-1 text-xs ring-1 ring-white/10 hover:bg-white/15"
                        >
                          {emoji} {count}
                        </button>
                      ))}
                      {reactionChoices.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => toggleReaction(message.id, emoji)}
                          className="rounded-full bg-zinc-900 px-2 py-1 text-xs ring-1 ring-white/10 hover:bg-white/15"
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => toggleThread(message.id)}
                        className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-100 ring-1 ring-amber-300/20 hover:bg-amber-400/20"
                      >
                        {(message._count?.replies || 0) > 0 ? `${message._count?.replies} réponse(s)` : "Ouvrir le fil"}
                      </button>
                    </div>
                    {openThreadId === message.id ? (
                      <div className="mt-3 rounded-xl bg-black/20 p-3 ring-1 ring-white/10">
                        <div className="mb-2 text-xs font-semibold text-zinc-300">Fil de discussion</div>
                        {(threadMessages[message.id] || []).map((reply) => (
                          <div key={reply.id} className="mb-2 rounded-lg bg-white/5 p-2 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{reply.sender.fullName}</span>
                              <span className="text-[11px] text-zinc-500">{displayTime(reply.createdAt)}</span>
                            </div>
                            {reply.text ? <div className="mt-1 whitespace-pre-wrap text-zinc-200">{reply.text}</div> : null}
                            {reply.fileUrl ? (
                              <a href={reply.fileUrl} className="mt-2 inline-flex text-xs text-amber-200">
                                {reply.fileName || "Pièce jointe"}
                              </a>
                            ) : null}
                          </div>
                        ))}
                        {(threadMessages[message.id] || []).length === 0 ? (
                          <div className="text-xs text-zinc-400">Aucune réponse pour l’instant.</div>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ))}

            {messages.length === 0 ? (
              <div className="rounded-2xl bg-zinc-950/40 p-8 text-center text-sm text-zinc-400 ring-1 ring-white/10">
                Aucun message dans cette conversation.
              </div>
            ) : null}
            {typingItems.length > 0 ? (
              <div className="rounded-full bg-white/5 px-3 py-2 text-xs text-zinc-300 ring-1 ring-white/10">
                {typingItems.map((item) => item.user.fullName).join(", ")} écrit...
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="border-t border-white/10 p-4">
            {replyTo ? (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-amber-400/10 px-3 py-2 text-sm text-amber-100 ring-1 ring-amber-300/20">
                <span>
                  Réponse à {replyTo.sender.fullName}: {replyTo.text || replyTo.fileName || "message"}
                </span>
                <button type="button" onClick={() => setReplyTo(null)} className="rounded-lg bg-white/10 px-2 py-1 text-xs">
                  Annuler
                </button>
              </div>
            ) : null}
            <div className="grid gap-2 md:grid-cols-[1fr_180px]">
              <input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="URL pièce jointe"
                className="rounded-xl bg-zinc-950/40 p-3 text-sm ring-1 ring-white/10"
              />
              <input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Nom fichier"
                className="rounded-xl bg-zinc-950/40 p-3 text-sm ring-1 ring-white/10"
              />
            </div>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15">
              {uploading ? "Upload en cours..." : "Joindre un fichier"}
              <input
                type="file"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  void uploadAttachment(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            <div className="mt-2 flex gap-2">
              <textarea
                value={text}
                onChange={(e) => changeComposerText(e.target.value)}
                onBlur={() => void sendTyping(false)}
                placeholder="Écrire un message..."
                rows={2}
                className="min-h-12 flex-1 resize-none rounded-xl bg-zinc-950/40 p-3 text-sm ring-1 ring-white/10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button disabled={busy || !selectedId} className="rounded-xl bg-amber-400/90 px-5 py-3 font-semibold text-zinc-950 disabled:opacity-60">
                Envoyer
              </button>
            </div>
          </form>
        </section>

        <aside className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <h2 className="font-semibold">Nouveau canal</h2>
          <form onSubmit={createConversation} className="mt-3 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom du canal"
              className="w-full rounded-xl bg-zinc-950/40 p-3 text-sm ring-1 ring-white/10"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chercher un membre"
              className="w-full rounded-xl bg-zinc-950/40 p-3 text-sm ring-1 ring-white/10"
            />
            <div className="max-h-56 space-y-2 overflow-auto rounded-xl bg-zinc-950/40 p-3 ring-1 ring-white/10">
              {filteredUsers.map((user) => (
                <div key={user.id} className="rounded-lg bg-white/5 p-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`h-2.5 w-2.5 rounded-full ${presenceDot(user.id)}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{user.fullName}</div>
                      <div className="text-[11px] text-zinc-400">{user.role}</div>
                    </div>
                    <button type="button" onClick={() => createDirect(user.id)} className="rounded-lg bg-white/10 px-2 py-1 text-xs hover:bg-white/15">
                      Direct
                    </button>
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-xs text-zinc-300">
                    <input type="checkbox" checked={memberIds.includes(user.id)} onChange={() => toggleMember(user.id)} />
                    Ajouter au canal
                  </label>
                </div>
              ))}
            </div>
            <button disabled={busy} className="w-full rounded-xl bg-amber-400/90 px-4 py-3 font-semibold text-zinc-950 disabled:opacity-60">
              Créer
            </button>
          </form>

          <div className="mt-6">
            <h2 className="font-semibold">Recherche</h2>
            <div className="mt-3 flex gap-2">
              <input
                value={messageSearch}
                onChange={(e) => setMessageSearch(e.target.value)}
                placeholder="Mot-clé"
                className="min-w-0 flex-1 rounded-xl bg-zinc-950/40 p-3 text-sm ring-1 ring-white/10"
              />
              <button type="button" onClick={searchMessages} className="rounded-xl bg-white/10 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15">
                OK
              </button>
            </div>
            <div className="mt-3 max-h-56 space-y-2 overflow-auto">
              {searchResults.map((message) => (
                <div key={message.id} className="rounded-xl bg-zinc-950/40 p-3 text-sm ring-1 ring-white/10">
                  <div className="font-medium">{message.sender.fullName}</div>
                  <div className="mt-1 text-zinc-300">{message.text}</div>
                  <div className="mt-1 text-[11px] text-zinc-500">{displayTime(message.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
