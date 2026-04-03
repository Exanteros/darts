const fs = require('fs');

const data = fs.readFileSync('src/lib/imap.ts', 'utf-8');
const replacement = `                    console.error('Failed to forward to admin:', err);
                  }
                }
              }
            } // end if (!existing)
          } // end if (msg && msg.source)

          await client.messageFlagsAdd(seq, ['\\\\Seen']);
        } catch (e) {
          console.error('Error fetching one message', e);
        }
      } // end for loop
    } finally {
      lock.release();
    }
  } catch (error) {
    if ((error as any).code === 'ENOTFOUND') {
        console.error('Error syncing IMAP emails: Could not connect to mail server.');
    } else {
        console.error('Error syncing IMAP emails:', error);
    }
  } finally {
    try { await client.logout(); } catch (e) {}
  }
}
`;

const lines = data.split('\n');
const fixedData = lines.slice(0, 256).join('\n') + '\n' + replacement;

fs.writeFileSync('src/lib/imap.ts', fixedData);
console.log("Written!");
