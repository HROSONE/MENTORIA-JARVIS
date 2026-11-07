import sys
from PIL import Image
d=sys.argv[1]; fs=sys.argv[3:]; out=sys.argv[2]
cols=4; rows=(len(fs)+3)//4
sh=Image.new('RGB',(270*cols,480*rows))
for i,f in enumerate(fs): sh.paste(Image.open(f'{d}/t{f}.png').resize((270,480)),((i%cols)*270,(i//cols)*480))
sh.save(out)
