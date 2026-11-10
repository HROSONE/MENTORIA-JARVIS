import subprocess, json, wave
N = [
 "Este gato sabia quem ia morrer.",
 "Providence, Estados Unidos. Um asilo para pacientes com demência. E um filhote adotado em dois mil e cinco: Oscar.",
 "Oscar não gostava de colo. Fazia a ronda sozinho, como um médico. Quase sempre, passava direto.",
 "Mas, de vez em quando, ele parava. Entrava. E se deitava ao lado de um paciente. Poucas horas depois, a pessoa morria.",
 "Depois de vinte e cinco acertos, a equipe passou a ligar para as famílias assim que Oscar se deitava. Para dar tempo de se despedir.",
 "Em dois mil e sete, um médico contou a história numa revista científica. Virou livro. A contagem passou de cinquenta. Algumas fontes falam em cem.",
 "Como ele sabia? Talvez o cheiro de substâncias que o corpo libera. Ninguém provou. A ciência ainda não tem resposta.",
 "Segundo relatos, Oscar partiu em dois mil e vinte e dois. Mas, nas últimas horas de tantas pessoas, ele estava lá.",
]
dur = []
for i, t in enumerate(N, 1):
    subprocess.run(["python3","-m","piper","-m","audio/pt_BR-faber-medium.onnx","--length-scale","1.12","--sentence-silence","0.35","-f",f"audio/n{i}.wav"], input=t.encode(), check=True, capture_output=True)
    w = wave.open(f"audio/n{i}.wav"); dur.append(w.getnframes()/w.getframerate()); w.close()
json.dump(dur, open("durs.json","w")); print([round(d,1) for d in dur], round(sum(dur),1))
