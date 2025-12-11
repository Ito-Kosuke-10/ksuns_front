"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";

type DeepDiveChatMessage = {
  role: "user" | "assistant";
  message: string;
  created_at: string;
};

type DeepDiveChatResponse = {
  card_id: string;
  card_title: string;
  initial_question: string;
  messages: DeepDiveChatMessage[];
  status?: string; // カードのステータス（オプショナル）
  summary?: string | null; // カードのサマリー（オプショナル）
};

export default function DeepDiveChatPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-slate-50 text-slate-900">
          <Container className="py-10">
            <Alert>読み込み中...</Alert>
          </Container>
        </main>
      }
    >
      <DeepDiveChatContent />
    </Suspense>
  );
}

function DeepDiveChatContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const cardId = params.cardId as string;
  const axis = searchParams.get("axis");

  const [chatData, setChatData] = useState<DeepDiveChatResponse | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // チャット履歴を取得
  useEffect(() => {
    if (!cardId) return;
    const loadChat = async () => {
      setLoading(true);
      const { data, status } = await apiFetch<DeepDiveChatResponse>(`/deep-dive/chat/${cardId}`);
      if (status === 401) {
        clearAccessToken();
        router.replace("/login");
        return;
      }
      if (data) {
        setChatData(data);
        // 初回アクセスでメッセージがない場合、初期質問を表示
        if (data.messages.length === 0) {
          setInput(data.initial_question);
        }
      } else {
        setError("チャット履歴の取得に失敗しました。");
      }
      setLoading(false);
    };
    loadChat().catch((err) => {
      setError("チャット履歴の取得に失敗しました。");
      console.error("Load chat error:", err);
      setLoading(false);
    });
  }, [cardId, router]);

  const handleSend = async () => {
    if (!input.trim() || !cardId || sending) return;
    setSending(true);
    setError(null);
    try {
      const { data, status } = await apiFetch<DeepDiveChatResponse>(`/deep-dive/chat/${cardId}`, {
        method: "POST",
        body: { message: input.trim() },
      });
      if (status === 401) {
        clearAccessToken();
        router.replace("/login");
        return;
      }
      if (status >= 400) {
        setError(`送信に失敗しました。ステータス: ${status}`);
        console.error("Send error:", { status, data });
        return;
      }
      if (data) {
        setChatData(data);
        setInput("");
      } else {
        setError("送信に失敗しました。時間をおいて再試行してください。");
        console.error("Send error: No data returned");
      }
    } catch (err) {
      setError(`送信に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleComplete = async () => {
    if (!cardId || completing) return;
    setCompleting(true);
    setError(null);
    try {
      const { data, status } = await apiFetch<{
        card_id: string;
        status: string;
        summary: string | null;
      }>(`/deep-dive/card/${cardId}/complete`, {
        method: "POST",
      });
      if (status === 401) {
        clearAccessToken();
        router.replace("/login");
        return;
      }
      if (status >= 400) {
        setError(`完了処理に失敗しました。ステータス: ${status}`);
        console.error("Complete error:", { status, data });
        return;
      }
      if (data) {
        console.log("✅ 完了処理成功:", data);
        console.log(`Status: ${data.status}, Summary: ${data.summary ? 'あり' : 'なし'}`);
        // 要約が生成された場合は表示
        if (data.summary) {
          alert(`カードを完了しました！\n\n【決定事項の要約】\n${data.summary}`);
        } else {
          alert("カードを完了しました！");
        }
        // 一覧ページに戻る（データベースのコミットが完了するのを待つため、少し長めの遅延を入れる）
        // 要約生成が完了しているので、1.5秒待ってから遷移
        setTimeout(() => {
          if (axis) {
            router.push(`/deep_questions?axis=${axis}`);
          } else {
            router.push("/deep_questions");
          }
        }, 1500);
      } else {
        console.error("❌ 完了処理失敗: data is null", { status });
        setError("完了処理に失敗しました。");
      }
    } catch (err) {
      setError("完了処理中にエラーが発生しました。");
      console.error("Complete error:", err);
    } finally {
      setCompleting(false);
    }
  };

  const messages = useMemo(() => chatData?.messages ?? [], [chatData]);
  const hasMessages = messages.length > 0;
  const isCompleted = messages.some(
    (msg) => msg.role === "assistant" && msg.message.includes("完了")
  );

  return (
    <main id="deep-dive-chat-root" className="bg-slate-50 text-slate-900">
      <Container id="deep-dive-chat-container" className="flex flex-col gap-6 py-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="px-3 py-2 text-xs"
              onClick={() => router.push(`/deep_questions${axis ? `?axis=${axis}` : ""}`)}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              一覧へ戻る
            </Button>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Deep Dive Chat
            </p>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {chatData?.card_title ?? "深掘りチャット"}
          </h1>
          {chatData?.initial_question && (
            <p className="text-sm text-slate-600">{chatData.initial_question}</p>
          )}
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {loading && <Alert>読み込み中...</Alert>}

        {!loading && chatData && (
          <Card className="flex flex-col gap-4 p-4">
            {/* チャット履歴 */}
            <div className="flex flex-col gap-3 min-h-[400px] max-h-[600px] overflow-y-auto">
              {!hasMessages && (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-slate-500">
                    最初の質問を送信して、深掘りを始めましょう。
                  </p>
                </div>
              )}
              {hasMessages && (
                <>
                  {messages.map((msg, index) => (
                    <div
                      key={`${msg.created_at}-${index}`}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xl rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          msg.role === "user"
                            ? "bg-sky-600 text-white"
                            : "bg-white text-slate-800 border border-slate-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-6">{msg.message}</p>
                        <p
                          className={`mt-1 text-[11px] ${
                            msg.role === "user" ? "text-sky-100" : "text-slate-500"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* 入力エリア */}
            <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-3">
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSend();
                  }
                }}
                placeholder="質問を入力してください（Cmd/Ctrl + Enter で送信）"
                disabled={sending}
              />
              <div className="flex items-center justify-between">
                <Button
                  variant="secondary"
                  onClick={handleComplete}
                  className="px-4 py-2 bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                  disabled={!hasMessages || sending || completing}
                >
                  {completing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      完了処理中...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      決定する（完了）
                    </span>
                  )}
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="px-4 py-2"
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      送信中...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      送信
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </Container>
    </main>
  );
}


                   SSUUMMMMAARRYY OOFF LLEESSSS CCOOMMMMAANNDDSS

      Commands marked with * may be preceded by a number, _N.
      Notes in parentheses indicate the behavior if _N is given.
      A key preceded by a caret indicates the Ctrl key; thus ^K is ctrl-K.

  h  H                 Display this help.
  q  :q  Q  :Q  ZZ     Exit.
 ---------------------------------------------------------------------------

                           MMOOVVIINNGG

  e  ^E  j  ^N  CR  *  Forward  one line   (or _N lines).
  y  ^Y  k  ^K  ^P  *  Backward one line   (or _N lines).
  f  ^F  ^V  SPACE  *  Forward  one window (or _N lines).
  b  ^B  ESC-v      *  Backward one window (or _N lines).
  z                 *  Forward  one window (and set window to _N).
  w                 *  Backward one window (and set window to _N).
  ESC-SPACE         *  Forward  one window, but don't stop at end-of-file.
  d  ^D             *  Forward  one half-window (and set half-window to _N).
  u  ^U             *  Backward one half-window (and set half-window to _N).
  ESC-)  RightArrow *  Right one half screen width (or _N positions).
  ESC-(  LeftArrow  *  Left  one half screen width (or _N positions).
  ESC-}  ^RightArrow   Right to last column displayed.
  ESC-{  ^LeftArrow    Left  to first column.
  F                    Forward forever; like "tail -f".
  ESC-F                Like F but stop when search pattern is found.
  r  ^R  ^L            Repaint screen.
  R                    Repaint screen, discarding buffered input.
        ---------------------------------------------------
        Default "window" is the screen height.
        Default "half-window" is half of the screen height.
 ---------------------------------------------------------------------------

                          SSEEAARRCCHHIINNGG

  /_p_a_t_t_e_r_n          *  Search forward for (_N-th) matching line.
  ?_p_a_t_t_e_r_n          *  Search backward for (_N-th) matching line.
  n                 *  Repeat previous search (for _N-th occurrence).
  N                 *  Repeat previous search in reverse direction.
  ESC-n             *  Repeat previous search, spanning files.
  ESC-N             *  Repeat previous search, reverse dir. & spanning files.
  ^O^N  ^On         *  Search forward for (_N-th) OSC8 hyperlink.
  ^O^P  ^Op         *  Search backward for (_N-th) OSC8 hyperlink.
  ^O^L  ^Ol            Jump to the currently selected OSC8 hyperlink.
  ESC-u                Undo (toggle) search highlighting.
  ESC-U                Clear search highlighting.
  &_p_a_t_t_e_r_n          *  Display only matching lines.
        ---------------------------------------------------
        A search pattern may begin with one or more of:
        ^N or !  Search for NON-matching lines.
        ^E or *  Search multiple files (pass thru END OF FILE).
        ^F or @  Start search at FIRST file (for /) or last file (for ?).
        ^K       Highlight matches, but don't move (KEEP position).
        ^R       Don't use REGULAR EXPRESSIONS.
        ^S _n     Search for match in _n-th parenthesized subpattern.
        ^W       WRAP search if no match found.
        ^L       Enter next character literally into pattern.
 ---------------------------------------------------------------------------

                           JJUUMMPPIINNGG

  g  <  ESC-<       *  Go to first line in file (or line _N).
  G  >  ESC->       *  Go to last line in file (or line _N).
  p  %              *  Go to beginning of file (or _N percent into file).
  t                 *  Go to the (_N-th) next tag.
  T                 *  Go to the (_N-th) previous tag.
  {  (  [           *  Find close bracket } ) ].
  }  )  ]           *  Find open bracket { ( [.
  ESC-^F _<_c_1_> _<_c_2_>  *  Find close bracket _<_c_2_>.
  ESC-^B _<_c_1_> _<_c_2_>  *  Find open bracket _<_c_1_>.
        ---------------------------------------------------
        Each "find close bracket" command goes forward to the close bracket 
          matching the (_N-th) open bracket in the top line.
        Each "find open bracket" command goes backward to the open bracket 
          matching the (_N-th) close bracket in the bottom line.

  m_<_l_e_t_t_e_r_>            Mark the current top line with <letter>.
  M_<_l_e_t_t_e_r_>            Mark the current bottom line with <letter>.
  '_<_l_e_t_t_e_r_>            Go to a previously marked position.
  ''                   Go to the previous position.
  ^X^X                 Same as '.
  ESC-m_<_l_e_t_t_e_r_>        Clear a mark.
        ---------------------------------------------------
        A mark is any upper-case or lower-case letter.
        Certain marks are predefined:
             ^  means  beginning of the file
             $  means  end of the file
 ---------------------------------------------------------------------------

                        CCHHAANNGGIINNGG FFIILLEESS

  :e [_f_i_l_e]            Examine a new file.
  ^X^V                 Same as :e.
  :n                *  Examine the (_N-th) next file from the command line.
  :p                *  Examine the (_N-th) previous file from the command line.
  :x                *  Examine the first (or _N-th) file from the command line.
  ^O^O                 Open the currently selected OSC8 hyperlink.
  :d                   Delete the current file from the command line list.
  =  ^G  :f            Print current file name.
 ---------------------------------------------------------------------------

                    MMIISSCCEELLLLAANNEEOOUUSS CCOOMMMMAANNDDSS

  -_<_f_l_a_g_>              Toggle a command line option [see OPTIONS below].
  --_<_n_a_m_e_>             Toggle a command line option, by name.
  __<_f_l_a_g_>              Display the setting of a command line option.
  ___<_n_a_m_e_>             Display the setting of an option, by name.
  +_c_m_d                 Execute the less cmd each time a new file is examined.

  !_c_o_m_m_a_n_d             Execute the shell command with $SHELL.
  #_c_o_m_m_a_n_d             Execute the shell command, expanded like a prompt.
  |XX_c_o_m_m_a_n_d            Pipe file between current pos & mark XX to shell command.
  s _f_i_l_e               Save input to a file.
  v                    Edit the current file with $VISUAL or $EDITOR.
  V                    Print version number of "less".
 ---------------------------------------------------------------------------

                           OOPPTTIIOONNSS

        Most options may be changed either on the command line,
        or from within less by using the - or -- command.
        Options may be given in one of two forms: either a single
        character preceded by a -, or a name preceded by --.

  -?  ........  --help
                  Display help (from command line).
  -a  ........  --search-skip-screen
                  Search skips current screen.
  -A  ........  --SEARCH-SKIP-SCREEN
                  Search starts just after target line.
  -b [_N]  ....  --buffers=[_N]
                  Number of buffers.
  -B  ........  --auto-buffers
                  Don't automatically allocate buffers for pipes.
  -c  ........  --clear-screen
                  Repaint by clearing rather than scrolling.
  -d  ........  --dumb
                  Dumb terminal.
  -D xx_c_o_l_o_r  .  --color=xx_c_o_l_o_r
                  Set screen colors.
  -e  -E  ....  --quit-at-eof  --QUIT-AT-EOF
                  Quit at end of file.
  -f  ........  --force
                  Force open non-regular files.
  -F  ........  --quit-if-one-screen
                  Quit if entire file fits on first screen.
  -g  ........  --hilite-search
                  Highlight only last match for searches.
  -G  ........  --HILITE-SEARCH
                  Don't highlight any matches for searches.
  -h [_N]  ....  --max-back-scroll=[_N]
                  Backward scroll limit.
  -i  ........  --ignore-case
                  Ignore case in searches that do not contain uppercase.
  -I  ........  --IGNORE-CASE
                  Ignore case in all searches.
  -j [_N]  ....  --jump-target=[_N]
                  Screen position of target lines.
  -J  ........  --status-column
                  Display a status column at left edge of screen.
  -k _f_i_l_e  ...  --lesskey-file=_f_i_l_e
                  Use a compiled lesskey file.
  -K  ........  --quit-on-intr
                  Exit less in response to ctrl-C.
  -L  ........  --no-lessopen
                  Ignore the LESSOPEN environment variable.
  -m  -M  ....  --long-prompt  --LONG-PROMPT
                  Set prompt style.
  -n .........  --line-numbers
                  Suppress line numbers in prompts and messages.
  -N .........  --LINE-NUMBERS
                  Display line number at start of each line.
  -o [_f_i_l_e] ..  --log-file=[_f_i_l_e]
                  Copy to log file (standard input only).
  -O [_f_i_l_e] ..  --LOG-FILE=[_f_i_l_e]
                  Copy to log file (unconditionally overwrite).
  -p _p_a_t_t_e_r_n .  --pattern=[_p_a_t_t_e_r_n]
                  Start at pattern (from command line).
  -P [_p_r_o_m_p_t]   --prompt=[_p_r_o_m_p_t]
                  Define new prompt.
  -q  -Q  ....  --quiet  --QUIET  --silent --SILENT
                  Quiet the terminal bell.
  -r  -R  ....  --raw-control-chars  --RAW-CONTROL-CHARS
                  Output "raw" control characters.
  -s  ........  --squeeze-blank-lines
                  Squeeze multiple blank lines.
  -S  ........  --chop-long-lines
                  Chop (truncate) long lines rather than wrapping.
  -t _t_a_g  ....  --tag=[_t_a_g]
                  Find a tag.
  -T [_t_a_g_s_f_i_l_e] --tag-file=[_t_a_g_s_f_i_l_e]
                  Use an alternate tags file.
  -u  -U  ....  --underline-special  --UNDERLINE-SPECIAL
                  Change handling of backspaces, tabs and carriage returns.
  -V  ........  --version
                  Display the version number of "less".
  -w  ........  --hilite-unread
                  Highlight first new line after forward-screen.
  -W  ........  --HILITE-UNREAD
                  Highlight first new line after any forward movement.
  -x [_N[,...]]  --tabs=[_N[,...]]
                  Set tab stops.
  -X  ........  --no-init
                  Don't use termcap init/deinit strings.
  -y [_N]  ....  --max-forw-scroll=[_N]
                  Forward scroll limit.
  -z [_N]  ....  --window=[_N]
                  Set size of window.
  -" [_c[_c]]  .  --quotes=[_c[_c]]
                  Set shell quote characters.
  -~  ........  --tilde
                  Don't display tildes after end of file.
  -# [_N]  ....  --shift=[_N]
                  Set horizontal scroll amount (0 = one half screen width).

                --exit-follow-on-close
                  Exit F command on a pipe when writer closes pipe.
                --file-size
                  Automatically determine the size of the input file.
                --follow-name
                  The F command changes files if the input file is renamed.
                --header=[_L[,_C[,_N]]]
                  Use _L lines (starting at line _N) and _C columns as headers.
                --incsearch
                  Search file as each pattern character is typed in.
                --intr=[_C]
                  Use _C instead of ^X to interrupt a read.
                --lesskey-context=_t_e_x_t
                  Use lesskey source file contents.
                --lesskey-src=_f_i_l_e
                  Use a lesskey source file.
                --line-num-width=[_N]
                  Set the width of the -N line number field to _N characters.
                --match-shift=[_N]
                  Show at least _N characters to the left of a search match.
                --modelines=[_N]
                  Read _N lines from the input file and look for vim modelines.
                --mouse
                  Enable mouse input.
                --no-keypad
                  Don't send termcap keypad init/deinit strings.
                --no-histdups
                  Remove duplicates from command history.
                --no-number-headers
                  Don't give line numbers to header lines.
                --no-search-header-lines
                  Searches do not include header lines.
                --no-search-header-columns
                  Searches do not include header columns.
                --no-search-headers
                  Searches do not include header lines or columns.
                --no-vbell
                  Disable the terminal's visual bell.
                --redraw-on-quit
                  Redraw final screen when quitting.
                --rscroll=[_C]
                  Set the character used to mark truncated lines.
                --save-marks
                  Retain marks across invocations of less.
                --search-options=[EFKNRW-]
                  Set default options for every search.
                --show-preproc-errors
                  Display a message if preprocessor exits with an error status.
                --proc-backspace
                  Process backspaces for bold/underline.
                --PROC-BACKSPACE
                  Treat backspaces as control characters.
                --proc-return
                  Delete carriage returns before newline.
                --PROC-RETURN
                  Treat carriage returns as control characters.
                --proc-tab
                  Expand tabs to spaces.
                --PROC-TAB
                  Treat tabs as control characters.
                --status-col-width=[_N]
                  Set the width of the -J status column to _N characters.
                --status-line
                  Highlight or color the entire line containing a mark.
                --use-backslash
                  Subsequent options use backslash as escape char.
                --use-color
                  Enables colored text.
                --wheel-lines=[_N]
                  Each click of the mouse wheel moves _N lines.
                --wordwrap
                  Wrap lines at spaces.


 ---------------------------------------------------------------------------

                          LLIINNEE EEDDIITTIINNGG

        These keys can be used to edit text being entered 
        on the "command line" at the bottom of the screen.

 RightArrow ..................... ESC-l ... Move cursor right one character.
 LeftArrow ...................... ESC-h ... Move cursor left one character.
 ctrl-RightArrow  ESC-RightArrow  ESC-w ... Move cursor right one word.
 ctrl-LeftArrow   ESC-LeftArrow   ESC-b ... Move cursor left one word.
 HOME ........................... ESC-0 ... Move cursor to start of line.
 END ............................ ESC-$ ... Move cursor to end of line.
 BACKSPACE ................................ Delete char to left of cursor.
 DELETE ......................... ESC-x ... Delete char under cursor.
 ctrl-BACKSPACE   ESC-BACKSPACE ........... Delete word to left of cursor.
 ctrl-DELETE .... ESC-DELETE .... ESC-X ... Delete word under cursor.
 ctrl-U ......... ESC (MS-DOS only) ....... Delete entire line.
 UpArrow ........................ ESC-k ... Retrieve previous command line.
 DownArrow ...................... ESC-j ... Retrieve next command line.
 TAB ...................................... Complete filename & cycle.
 SHIFT-TAB ...................... ESC-TAB   Complete filename & reverse cycle.
 ctrl-L ................................... Complete filename, list all.
