package site.smarttaxsolution.app;

import android.app.Activity;
import android.os.Bundle;
import android.content.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.view.Gravity;
import android.view.View;
import android.widget.*;
import java.text.SimpleDateFormat;
import java.util.*;

public class MainActivity extends Activity {
    private final int navy=Color.rgb(18,39,76), blue=Color.rgb(38,98,190), pale=0xFFF2F5FA;
    private LinearLayout root,body,nav;
    private String current="Home";
    private android.content.SharedPreferences prefs;
    private final String[] tabs={"Home","Services","Notifications","Profile"};

    @Override public void onCreate(Bundle b){
        super.onCreate(b); prefs=getSharedPreferences("smarttax_user",MODE_PRIVATE);
        getWindow().setStatusBarColor(navy); getWindow().setNavigationBarColor(Color.WHITE);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        root=new LinearLayout(this); root.setOrientation(1); root.setBackgroundColor(pale); setContentView(root);
        ScrollView sc=new ScrollView(this); sc.setFillViewport(true);
        body=new LinearLayout(this); body.setOrientation(1); sc.addView(body);
        root.addView(sc,new LinearLayout.LayoutParams(-1,0,1));
        nav=new LinearLayout(this); nav.setBackgroundColor(Color.WHITE); nav.setElevation(dp(9));
        root.addView(nav,new LinearLayout.LayoutParams(-1,dp(66))); show("Home");
    }
    int dp(float n){return (int)(n*getResources().getDisplayMetrics().density+.5f);}
    GradientDrawable shape(int color,int radius){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(radius));return d;}
    TextView txt(String s,int z,int c,boolean b){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(c);if(b)t.setTypeface(Typeface.DEFAULT,1);return t;}
    LinearLayout col(){LinearLayout l=new LinearLayout(this);l.setOrientation(1);return l;}
    void padding(View v,int n){v.setPadding(dp(n),dp(n),dp(n),dp(n));}
    void show(String tab){
        current=tab;body.removeAllViews();nav.removeAllViews();
        if(tab.equals("Home"))home();else if(tab.equals("Services"))services();else if(tab.equals("Notifications"))notifications();else profile();
        String[] glyph={"⌂","▦","♧","●"};
        for(int i=0;i<tabs.length;i++){final String name=tabs[i];LinearLayout it=col();it.setGravity(Gravity.CENTER);
            TextView a=txt(glyph[i],21,name.equals(tab)?blue:0xFF818A99,true);a.setGravity(17);
            TextView b=txt(name,10,name.equals(tab)?blue:0xFF818A99,name.equals(tab));b.setGravity(17);it.addView(a);it.addView(b);
            it.setOnClickListener(v->show(name));nav.addView(it,new LinearLayout.LayoutParams(0,-1,1));}
    }
    void header(String title,String subtitle){LinearLayout h=col();padding(h,20);h.setBackgroundColor(navy);
        h.addView(txt("SMART TAX SOLUTION",11,0xFFBFD2F2,true));TextView t=txt(title,25,Color.WHITE,true);t.setPadding(0,dp(8),0,dp(4));h.addView(t);h.addView(txt(subtitle,13,0xFFE1E9F7,false));body.addView(h);}
    void section(String s){TextView t=txt(s,18,navy,true);t.setPadding(dp(17),dp(17),dp(17),dp(7));body.addView(t);}
    void card(String icon,String title,String desc,Runnable run){LinearLayout c=new LinearLayout(this);c.setGravity(Gravity.CENTER_VERTICAL);c.setBackground(shape(Color.WHITE,15));c.setElevation(dp(2));padding(c,13);
        TextView ic=txt(icon,19,blue,true);ic.setGravity(17);ic.setBackground(shape(0xFFEAF1FC,12));c.addView(ic,new LinearLayout.LayoutParams(dp(46),dp(46)));
        LinearLayout w=col();w.setPadding(dp(12),0,0,0);w.addView(txt(title,15,navy,true));TextView d=txt(desc,12,0xFF596273,false);d.setPadding(0,dp(4),0,0);w.addView(d);c.addView(w,new LinearLayout.LayoutParams(0,-2,1));
        TextView arrow=txt("›",25,0xFF8793A5,false);c.addView(arrow);c.setOnClickListener(v->run.run());
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(dp(15),dp(5),dp(15),dp(8));body.addView(c,p);}
    void banner(String title,String desc){LinearLayout b=col();b.setBackground(shape(blue,18));padding(b,18);b.addView(txt("SMART TAX • DIGITAL SERVICES",10,0xFFDCE9FF,true));
        TextView t=txt(title,20,Color.WHITE,true);t.setPadding(0,dp(8),0,dp(6));b.addView(t);b.addView(txt(desc,13,Color.WHITE,false));
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(dp(15),dp(15),dp(15),dp(4));body.addView(b,p);}
    void home(){header("Your Tax, Simplified","A smarter way to access tax services and learning");banner("Tax support, made simple","Explore services, manage your profile and contact our team.");
        section("Quick services");card("GST","GST Services","Registration, returns and compliance",()->show("Services"));
        card("₹","Income Tax","ITR assistance and tax information",()->detail("Income Tax","Income tax return assistance and tax-related support."));
        card("▣","Accounting","Tally, Busy and accounting support",()->detail("Accounting","Accounting and software support. Contact our team for details."));
        section("Learning & assistance");card("▤","Courses & Exams","Course information, exams and certificates",()->detail("Courses & Exams","The dedicated course, examination, result and certificate system requires secure account and backend integration."));
        card("☎","WhatsApp Support","Chat with Smart Tax Solution",()->open("https://wa.me/919664029638"));}
    void services(){header("Our Services","Choose a service to know more");section("Tax & compliance");
        card("＋","GST Registration","Registration and documentation assistance",()->detail("GST Registration","Get assistance with GST registration and required documents."));
        card("↻","GST Returns","GSTR-1, GSTR-3B and compliance",()->detail("GST Returns","Return preparation and compliance assistance."));
        card("₹","Income Tax","Income tax return support",()->detail("Income Tax","ITR filing and income tax assistance."));
        card("▦","Accounting","Bookkeeping, Tally and Busy",()->detail("Accounting","Accounting and software support."));
        section("Official portals");card("↗","GST Portal","Government of India",()->open("https://www.gst.gov.in/"));
        card("↗","Income Tax Portal","Government of India",()->open("https://www.incometax.gov.in/"));
        card("↗","Udyam Portal","MSME registration",()->open("https://udyamregistration.gov.in/"));
        card("☎","Talk to our team","WhatsApp support",()->open("https://wa.me/919664029638"));}
    void notifications(){header("Notifications","Your updates and alerts");section("App updates");
        card("•","Welcome to Smart Tax","Your app dashboard is ready.",()->detail("Welcome","Thank you for using Smart Tax Solution."));
        card("!","Need assistance?","Our team is available on WhatsApp.",()->open("https://wa.me/919664029638"));
        TextView n=txt("Personalised application, payment, course and exam alerts will appear here after notification and account services are connected.",13,0xFF596273,false);padding(n,18);body.addView(n);}
    void profile(){header("My Profile","Manage your contact information");LinearLayout box=col();box.setBackground(shape(Color.WHITE,16));padding(box,16);
        box.addView(txt("Your details",17,navy,true));String name=prefs.getString("name","");String phone=prefs.getString("phone","");
        box.addView(txt(name.isEmpty()?"Profile not set up":name,15,0xFF333B49,true));
        box.addView(txt(phone.isEmpty()?"Add your mobile number":phone,13,0xFF596273,false));
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(dp(15),dp(16),dp(15),dp(8));body.addView(box,p);
        card("✎","Edit Profile","Update your name, mobile and email",()->editProfile());
        card("✉","Email Support","smarttaxsolutionsgnr@gmail.com",()->open("mailto:smarttaxsolutionsgnr@gmail.com"));
        card("☎","WhatsApp Support","96640 29638",()->open("https://wa.me/919664029638"));
        card("ⓘ","About Smart Tax","Sri Ganganagar, Rajasthan",()->detail("About Smart Tax Solution","Tax, GST and accounting assistance.\nSri Ganganagar, Rajasthan."));}
    void editProfile(){LinearLayout form=col();EditText name=new EditText(this);name.setSingleLine();name.setHint("Full name");name.setText(prefs.getString("name",""));
        EditText phone=new EditText(this);phone.setSingleLine();phone.setHint("Mobile number");phone.setInputType(3);phone.setText(prefs.getString("phone",""));
        EditText email=new EditText(this);email.setSingleLine();email.setHint("Email address");email.setInputType(33);email.setText(prefs.getString("email",""));
        form.addView(name);form.addView(phone);form.addView(email);padding(form,8);
        new android.app.AlertDialog.Builder(this).setTitle("Edit Profile").setView(form).setNegativeButton("Cancel",null).setPositiveButton("Save",(d,w)->{
            prefs.edit().putString("name",name.getText().toString().trim()).putString("phone",phone.getText().toString().trim()).putString("email",email.getText().toString().trim()).apply();show("Profile");
        }).show();}
    void detail(String title,String msg){new android.app.AlertDialog.Builder(this).setTitle(title).setMessage(msg).setPositiveButton("OK",null).setNeutralButton("WhatsApp",(d,w)->open("https://wa.me/919664029638")).show();}
    void open(String u){try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(u)));}catch(Exception e){detail("Unable to open","No compatible app found.");}}
    @Override public void onBackPressed(){if(!current.equals("Home"))show("Home");else super.onBackPressed();}
}
