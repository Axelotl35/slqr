
function present(){
    let eq = new Equation(0.5,0.5,"a^2 + b^2 = c^2",0.1,0);
    Add(eq);
    Play(Write(eq),0.1);
    Play(Wait(1))

    let title = new Text(0.5,0.2,"1. Binomial Equation",5,colcopy(AWHITE));
    Add(title)
    Play(Write(title,0.4));

    let s = new Selector(0.2,0.3,0.8,0.7,colcopy(AWHITE));
    Add(s);
    Play(Select(s,1,0));
    Play(Clear(1,1));
}