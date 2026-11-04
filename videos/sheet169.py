import sys
from PIL import Image
d=sys.argv[1]; out=sys.argv[2]; fs=sys.argv[3:]
cols=3; rows=(len(fs)+cols-1)//cols
sh=Image.new('RGB',(480*cols,270*rows))
for i,f in enumerate(fs): sh.paste(Image.open(f'{d}/t{f}.png').resize((480,270)),((i%cols)*480,(i//cols)*270))
sh.save(out)
