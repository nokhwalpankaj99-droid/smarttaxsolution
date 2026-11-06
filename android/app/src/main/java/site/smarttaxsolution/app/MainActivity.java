package site.smarttaxsolution.app;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.content.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.view.Gravity;
import android.view.View;
import android.widget.*;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;

public class MainActivity extends Activity {
    private static final String BASE="https://jbjergbqjokxxcvntimk.supabase.co";
    private static final String KEY="sb_publishable_wOwWiLuundz06ABsksvrbQ_2oXiV_5k";
    private final int navy=Color.rgb(18,39,76),blue=Color.rgb(38,98,190),pale=0xFFF2F5FA;
    private LinearLayout root,body,nav;
    private SharedPreferences prefs;
    private ExecutorService worker=Executors.newSingleThreadExecutor();
    private String current="Home";
    private final Handler idleHandler=new Handler(Looper.getMainLooper());
    private Runnable idleWarning,idleLogout;
    private final String[] tabs={"Home","Courses","Services","Profile"};

    @Override public void onCreate(Bundle b){super.onCreate(b);
        prefs=getSharedPreferences("smarttax_session",MODE_PRIVATE);
        getWindow().setStatusBarColor(navy);getWindow().setNavigationBarColor(Color.WHITE);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        root=new LinearLayout(this);root.setOrientation(1);root.setBackgroundColor(pale);setContentView(root);
        ScrollView sc=new ScrollView(this);sc.setFillViewport(true);body=new LinearLayout(this);body.setOrientation(1);sc.addView(body);
        root.addView(sc,new LinearLayout.LayoutParams(-1,0,1));nav=new LinearLayout(this);nav.setBackgroundColor(Color.WHITE);root.addView(nav,new LinearLayout.LayoutParams(-1,dp(62)));
        if(prefs.getString("access","").isEmpty())authScreen();else show("Home");
        resetIdleTimer();
    }
    int dp(float n){return (int)(n*getResources().getDisplayMetrics().density+.5f);}
    GradientDrawable shape(int c,int r){GradientDrawable d=new GradientDrawable();d.setColor(c);d.setCornerRadius(dp(r));return d;}
    TextView text(String s,int z,int c,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(c);if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;}
    LinearLayout col(){LinearLayout l=new LinearLayout(this);l.setOrientation(1);return l;}
    void pad(View v,int n){v.setPadding(dp(n),dp(n),dp(n),dp(n));}
    EditText field(String hint,int type){EditText e=new EditText(this);e.setSingleLine(true);e.setHint(hint);e.setInputType(type);return e;}
    void message(String s){new android.app.AlertDialog.Builder(this).setMessage(s).setPositiveButton("OK",null).show();}
    void authScreen(){
        nav.removeAllViews();body.removeAllViews();LinearLayout card=col();card.setBackground(shape(Color.WHITE,18));pad(card,20);
        TextView brand=text("SMART TAX SOLUTION",14,blue,true);card.addView(brand);
        TextView title=text("Student Login",25,navy,true);title.setPadding(0,dp(12),0,dp(4));card.addView(title);
        card.addView(text("Sign in with the same account used on the Smart Tax website.",13,0xFF5B6575,false));
        EditText email=field("Registered email",33),pass=field("Password",129);email.setPadding(0,dp(12),0,dp(8));pass.setPadding(0,dp(12),0,dp(8));card.addView(email);card.addView(pass);
        Button login=new Button(this);login.setText("Sign In");card.addView(login);
        Button register=new Button(this);register.setText("Create Student Account");card.addView(register);
        Button forgot=new Button(this);forgot.setText("Forgot Password");card.addView(forgot);
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(dp(18),dp(45),dp(18),dp(18));body.addView(card,p);
        login.setOnClickListener(v->{String em=email.getText().toString().trim(),pw=pass.getText().toString();if(em.isEmpty()||pw.isEmpty()){message("Enter email and password.");return;}busy(login,true);request("POST","/auth/v1/token?grant_type=password",authBody(em,pw),null,(res,err)->{busy(login,false);if(err!=null){message(err);return;}try{saveSession(res);show("Home");}catch(Exception x){message("Login response was incomplete.");}});});
        register.setOnClickListener(v->registration());
        forgot.setOnClickListener(v->{if(email.getText().toString().trim().isEmpty()){message("Enter your registered email first.");return;}try{JSONObject j=new JSONObject();j.put("email",email.getText().toString().trim());request("POST","/auth/v1/recover",j,null,(res,err)->message(err==null?"If the account exists, a password recovery email has been sent.":"Could not send recovery email: "+err));}catch(Exception ignored){}});
    }
    void registration(){
        LinearLayout f=col();EditText name=field("Full name",1),phone=field("Mobile number",3),father=field("Father's name",1),mother=field("Mother's name",1),address=field("Address",1),email=field("Email",33),pw=field("Password (minimum 8 characters)",129);
        f.addView(name);f.addView(phone);f.addView(father);f.addView(mother);f.addView(address);f.addView(email);f.addView(pw);pad(f,8);
        new android.app.AlertDialog.Builder(this).setTitle("Student Registration").setView(f).setNegativeButton("Cancel",null).setPositiveButton("Register",(d,w)->{
            if(name.length()==0||phone.length()==0||father.length()==0||mother.length()==0||address.length()==0||email.length()==0||pw.length()<8){message("Complete all details. Password must contain at least 8 characters.");return;}
            try{JSONObject meta=new JSONObject();meta.put("full_name",name.getText().toString());meta.put("phone",phone.getText().toString());meta.put("father_name",father.getText().toString());meta.put("mother_name",mother.getText().toString());meta.put("address",address.getText().toString());JSONObject j=authBody(email.getText().toString().trim(),pw.getText().toString());j.put("data",meta);
                request("POST","/auth/v1/signup",j,null,(res,err)->{if(err!=null)message("Registration failed: "+err);else{try{JSONObject x=new JSONObject(res);if(x.has("access_token")){saveSession(res);show("Home");}else message("Registration received. Confirm your email, then sign in.");}catch(Exception ex){message("Registration received. Check your email for confirmation.");}}});
            }catch(Exception ex){message("Could not prepare registration.");}
        }).show();
    }
    JSONObject authBody(String e,String p){JSONObject j=new JSONObject();try{j.put("email",e);j.put("password",p);}catch(Exception ignored){}return j;}
    interface Done{void finish(String result,String error);}
    void request(String method,String path,JSONObject data,String token,Done done){
        worker.execute(()->{String result=null,error=null;HttpURLConnection c=null;try{
            c=(HttpURLConnection)new URL(BASE+path).openConnection();c.setRequestMethod(method);c.setConnectTimeout(15000);c.setReadTimeout(20000);c.setRequestProperty("apikey",KEY);c.setRequestProperty("Accept","application/json");
            if(token!=null&&!token.isEmpty())c.setRequestProperty("Authorization","Bearer "+token);
            if(data!=null){c.setDoOutput(true);c.setRequestProperty("Content-Type","application/json");try(OutputStream o=c.getOutputStream()){o.write(data.toString().getBytes(StandardCharsets.UTF_8));}}
            int code=c.getResponseCode();InputStream in=code>=200&&code<300?c.getInputStream():c.getErrorStream();ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[4096];int n;while((n=in.read(b))!=-1)out.write(b,0,n);result=out.toString("UTF-8");if(code<200||code>=300){try{JSONObject j=new JSONObject(result);error=j.optString("msg",j.optString("message",j.optString("error_description",j.optString("error","Request failed ("+code+")"))));}catch(Exception ex){error="Request failed ("+code+")";}}
        }catch(Exception ex){error="Network error. Check your internet connection."; }finally{if(c!=null)c.disconnect();}
        final String rr=result,ee=error;runOnUiThread(()->done.finish(rr,ee));});
    }
    void saveSession(String raw)throws Exception{JSONObject j=new JSONObject(raw);String access=j.getString("access_token"),refresh=j.optString("refresh_token","");JSONObject u=j.getJSONObject("user");prefs.edit().putString("access",access).putString("refresh",refresh).putString("uid",u.optString("id")).putString("email",u.optString("email")).apply();}
    void busy(Button b,boolean yes){b.setEnabled(!yes);b.setText(yes?"Please wait…": "Sign In");}
    void header(String title,String sub){LinearLayout h=col();pad(h,20);h.setBackgroundColor(navy);h.addView(text("SMART TAX SOLUTION",11,0xFFBFD2F2,true));TextView t=text(title,25,Color.WHITE,true);t.setPadding(0,dp(8),0,dp(4));h.addView(t);h.addView(text(sub,13,0xFFE1E9F7,false));body.addView(h);}
    void card(String icon,String title,String desc,Runnable action){LinearLayout c=new LinearLayout(this);c.setGravity(Gravity.CENTER_VERTICAL);c.setBackground(shape(Color.WHITE,14));pad(c,13);TextView i=text(icon,20,blue,true);c.addView(i,new LinearLayout.LayoutParams(dp(42),dp(42)));LinearLayout w=col();w.addView(text(title,15,navy,true));w.addView(text(desc,12,0xFF596273,false));c.addView(w,new LinearLayout.LayoutParams(0,-2,1));c.setOnClickListener(v->action.run());LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(dp(14),dp(6),dp(14),dp(6));body.addView(c,p);}
    void show(String tab){current=tab;body.removeAllViews();nav.removeAllViews();
        if(tab.equals("Home")){header("Your Tax, Simplified","Access your Smart Tax student account");card("▤","Courses & Exams","Browse published courses",()->show("Courses"));card("₹","Payment Status","Submit and track course payment on the portal",()->open("https://smarttaxsolution.site/student.html#payment"));card("▣","Certificates & Marksheet","View results and download documents",()->open("https://smarttaxsolution.site/student.html"));card("☎","WhatsApp Support","Chat with Smart Tax Solution",()->open("https://wa.me/919664029638"));}
        else if(tab.equals("Courses")){header("Courses & Exams","Published courses from your Smart Tax account");TextView loading=text("Loading published courses…",14,navy,false);pad(loading,18);body.addView(loading);loadCourses(loading);}
        else if(tab.equals("Services")){header("Services","Tax and accounting support");card("GST","GST Portal","Government portal",()->open("https://www.gst.gov.in/"));card("₹","Income Tax Portal","Government portal",()->open("https://www.incometax.gov.in/"));card("▦","Udyam Registration","MSME portal",()->open("https://udyamregistration.gov.in/"));card("☎","WhatsApp","96640 29638",()->open("https://wa.me/919664029638"));}
        else{header("My Profile","Your registered Smart Tax student details");TextView details=text("Loading profile…",14,navy,false);pad(details,18);body.addView(details);loadProfile(details);card("⇥","Sign Out","End this session on this device",()->logoutNow());}
        String[] glyph={"⌂","▤","▦","●"};for(int i=0;i<tabs.length;i++){final String n=tabs[i];TextView b=text(glyph[i]+"\n"+n,11,n.equals(tab)?blue:0xFF818A99,true);b.setGravity(17);nav.addView(b,new LinearLayout.LayoutParams(0,-1,1));b.setOnClickListener(v->show(n));}
    }
    void loadCourses(TextView target){request("GET","/rest/v1/courses?select=id,slug,title,description&is_published=eq.true&order=title.asc",null,prefs.getString("access",""),(res,err)->{if(err!=null){target.setText("Courses could not be loaded: "+err);return;}try{JSONArray a=new JSONArray(res);LinearLayout parent=(LinearLayout)target.getParent();parent.removeView(target);if(a.length()==0){TextView none=text("No courses are currently published.",14,navy,false);pad(none,18);parent.addView(none);return;}for(int i=0;i<a.length();i++){JSONObject c=a.getJSONObject(i);String title=c.optString("title"),desc=c.optString("description"),slug=c.optString("slug");card("▤",title,desc+"\nOpen the student portal to enrol, pay and take the exam.",()->open("https://smarttaxsolution.site/student.html"));}}catch(Exception ex){target.setText("Could not read the course list.");}});}
    
    void loadProfile(TextView target){
        String uid=prefs.getString("uid","");
        if(uid.isEmpty()){target.setText("Please sign in again to load your profile.");return;}
        request("GET","/rest/v1/profiles?select=full_name,phone,father_name,mother_name,address&id=eq."+Uri.encode(uid),null,prefs.getString("access",""),(res,err)->{
            if(err!=null){target.setText("Profile details could not be loaded. "+err);return;}
            try{JSONArray a=new JSONArray(res);if(a.length()==0){target.setText("Email: "+prefs.getString("email","")+"\\nProfile details are not available yet.");return;}
                JSONObject p=a.getJSONObject(0);
                target.setText("Name: "+p.optString("full_name","—")+"\\nEmail: "+prefs.getString("email","—")+"\\nMobile: "+p.optString("phone","—")+"\\nFather: "+p.optString("father_name","—")+"\\nMother: "+p.optString("mother_name","—")+"\\nAddress: "+p.optString("address","—"));
            }catch(Exception e){target.setText("Could not read profile details.");}
        });
    }
    void logoutNow(){idleHandler.removeCallbacksAndMessages(null);prefs.edit().clear().apply();authScreen();message("You have been signed out.");}
    void resetIdleTimer(){
        if(prefs==null||prefs.getString("access","").isEmpty())return;
        idleHandler.removeCallbacksAndMessages(null);
        idleWarning=()->new android.app.AlertDialog.Builder(this).setTitle("Session about to expire").setMessage("You have been inactive. Continue using the app?").setNegativeButton("Log out",(d,w)->logoutNow()).setPositiveButton("Continue",(d,w)->resetIdleTimer()).setOnCancelListener(d->resetIdleTimer()).show();
        idleLogout=()->{if(!isFinishing()&&!prefs.getString("access","").isEmpty())logoutNow();};
        idleHandler.postDelayed(idleWarning,9*60*1000L);idleHandler.postDelayed(idleLogout,10*60*1000L);
    }
    @Override public boolean dispatchTouchEvent(android.view.MotionEvent ev){if(ev.getAction()==android.view.MotionEvent.ACTION_DOWN)resetIdleTimer();return super.dispatchTouchEvent(ev);}
    @Override public boolean dispatchKeyEvent(android.view.KeyEvent ev){if(ev.getAction()==android.view.KeyEvent.ACTION_DOWN)resetIdleTimer();return super.dispatchKeyEvent(ev);}
    void open(String u){try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(u)));}catch(Exception e){message("Unable to open this link.");}}
    @Override public void onBackPressed(){if(!prefs.getString("access","").isEmpty()&&!current.equals("Home"))show("Home");else super.onBackPressed();}
    @Override protected void onDestroy(){idleHandler.removeCallbacksAndMessages(null);super.onDestroy();worker.shutdownNow();}
}
