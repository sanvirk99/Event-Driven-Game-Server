import os
import subprocess

#inscape cmd line automation for faster svg scaling instead of manually scaling each svg in gui

suits = ['C', 'D', 'H', 'S']
ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K', 'A']

#example usage
#/Applications/Inkscape.app/Contents/MacOS/inkscape 3C.svg --actions="select-all;fit-canvas-to-selection;export-do;file-close"        

def scale_svgs(inkscape_path, svg_dir):


    for suit in suits:

        for rank in ranks:
            svg_path = os.path.join(svg_dir, rank + suit + '.svg')
            subprocess.run([inkscape_path, svg_path, '--actions=select-all;fit-canvas-to-selection;export-filename:'+svg_dir+'/'+rank+suit+'_python.svg;export-do;file-close'])
        

inkscape_path = '/Applications/Inkscape.app/Contents/MacOS/inkscape'
svg_dir = '/Users/san/WebDev/blackjack-browser/frontend/src/assets/img'
scale_svgs(inkscape_path, svg_dir)