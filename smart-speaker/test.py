import config
import socket
import struct

server_sock = socket.socket(
    socket.AF_BLUETOOTH,
    socket.SOCK_STREAM,
    socket.BTPROTO_RFCOMM
)
server_sock.bind((config.PI_BT_ADDRESS, config.BT_CHANNEL))
server_sock.listen(1)

print("Aștept conexiune pe canal RFCOMM 2...")
client_sock, address = server_sock.accept()
print(f"Conectat: {address}")

# Trimite un mesaj de test
msg = b"Hello from Pi!"
header = struct.pack('>H', len(msg))
client_sock.send(header + msg)

print("Mesaj trimis, aștept răspuns...")
header = client_sock.recv(2)
length = struct.unpack('>H', header)[0]
data = client_sock.recv(length)
print(f"Primit: {data.decode()}")

client_sock.close()
server_sock.close()